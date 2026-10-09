const crypto = require('crypto');
const RecordId = require('../../../core/database/RecordId');
const NotificationClassifier = require('./NotificationClassifier');
const ThreadKey = require('./ThreadKey');
const ThreadRepository = require('./ThreadRepository');

class InboxService {
  static NOTIFICATION_PREFIX = 'ntf';
  static THREAD_PREFIX = 'thr';
  static AUTOMATION_HOST = 'automation';
  static DEFAULT_SNOOZE_MS = 4 * 60 * 60 * 1000;
  static CHANGED_EVENT = 'thread.changed';

  constructor({ notifications, threads, emit = () => {}, now = () => new Date(), dedupeWindowMs = 60000, retentionDays = 90, pruneEvery = 100 } = {}) {
    this._notifications = notifications;
    this._threads = threads;
    this._emit = emit;
    this._now = now;
    this._dedupeWindowMs = dedupeWindowMs;
    this._retentionDays = retentionDays;
    this._pruneEvery = pruneEvery;
    this._ingested = 0;
  }

  ingest(notification = {}, tab = null) {
    const n = notification && typeof notification === 'object' ? notification : {};
    const host = NotificationClassifier.hostOf(n.url || (tab && tab.url), n.source);
    const classified = NotificationClassifier.classify({ ...n, host, tabTitle: n.tabTitle || (tab && tab.title) });
    const now = this._now();
    const dedupeKey = InboxService._dedupeKey(n, classified, (tab && tab.partition) || host, now);
    if (this._notifications.hasDedupe(dedupeKey, new Date(now.getTime() - this._dedupeWindowMs).toISOString())) return { duplicate: true };
    const thread = this._touchThread(classified.app, classified.threadKey, {
      title: classified.threadTitle, participants: classified.participants, url: n.url || '', at: now.toISOString(),
    });
    const stored = this._notifications.insert({
      id: RecordId.create(InboxService.NOTIFICATION_PREFIX),
      receivedAt: now.toISOString(),
      app: classified.app,
      host,
      partition: (tab && tab.partition) || '',
      tabTitle: n.tabTitle || (tab && tab.title) || '',
      title: n.title,
      body: n.body,
      url: n.url,
      tag: n.tag,
      sender: classified.sender,
      threadKey: classified.threadKey,
      threadId: thread.id,
      dedupeKey,
      data: n.data == null ? null : n.data,
    });
    this._pruneOccasionally(now);
    this._emit(InboxService.CHANGED_EVENT, { threadId: thread.id, reason: 'notification' });
    return { duplicate: false, notification: stored, thread };
  }

  listThreads({ state = 'open', app = null, limit = 100, offset = 0 } = {}) {
    const threads = this._threads.list({ state, app, limit, offset, nowIso: this._now().toISOString() });
    return threads.map((thread) => ({ ...thread, lastNotification: this._lastNotification(thread.id) }));
  }

  getThread(id) {
    const thread = this._threads.get(id);
    if (!thread) return null;
    return { thread, notifications: this._notifications.listForThread(id) };
  }

  setThreadState(id, state, { snoozeUntil = null } = {}) {
    if (!ThreadRepository.STATES.includes(state)) throw new Error(`unknown thread state "${state}"`);
    if (!this._threads.get(id)) return null;
    const columns = { state, snooze_until: null };
    if (state === 'snoozed') columns.snooze_until = this._snoozeTime(snoozeUntil);
    const thread = this._threads.update(id, columns);
    this._emit(InboxService.CHANGED_EVENT, { threadId: id, reason: 'state' });
    return thread;
  }

  enrichThread(ref = {}, enrichment = {}) {
    const existing = ref.id ? this._threads.get(ref.id) : this._threads.findByKey(String(ref.app || ''), String(ref.threadKey || ''));
    if (!existing && !ref.app) throw new Error('enrichThread needs an id or an app and threadKey');
    const thread = existing || this._createThread(ref.app, ref.threadKey || ThreadKey.normalize(enrichment.title) || ref.app, {
      title: enrichment.title || '', participants: [], url: enrichment.url || '', at: this._now().toISOString(), count: 0,
    });
    const columns = InboxService._enrichmentColumns(thread, enrichment);
    const updated = Object.keys(columns).length ? this._threads.update(thread.id, columns) : thread;
    this._emit(InboxService.CHANGED_EVENT, { threadId: thread.id, reason: 'enriched' });
    return updated;
  }

  pushItem(item = {}) {
    const app = String(item.app || 'automation').trim() || 'automation';
    const title = String(item.title || '').trim();
    const threadKey = String(item.threadKey || '').trim() || ThreadKey.normalize(title) || app;
    const at = InboxService._isoOrNow(item.at, this._now());
    const sender = String(item.sender || '').trim();
    const participants = [...new Set([...(Array.isArray(item.participants) ? item.participants : []), ...(sender ? [sender] : [])])];
    const thread = this._touchThread(app, threadKey, { title, participants, url: item.url || '', at });
    const enrichment = { summary: item.summary, priority: item.priority, labels: item.labels, context: item.context };
    const columns = InboxService._enrichmentColumns(thread, enrichment);
    const enriched = Object.keys(columns).length ? this._threads.update(thread.id, columns) : thread;
    const notification = this._notifications.insert({
      id: RecordId.create(InboxService.NOTIFICATION_PREFIX),
      receivedAt: at,
      app,
      host: InboxService.AUTOMATION_HOST,
      title,
      body: String(item.body || item.summary || ''),
      url: item.url || '',
      sender,
      threadKey,
      threadId: thread.id,
      dedupeKey: `automation:${app}:${threadKey}:${at}`,
      data: null,
    });
    this._emit(InboxService.CHANGED_EVENT, { threadId: thread.id, reason: 'pushed' });
    return { thread: enriched, notification };
  }

  linkToTask(threadId, taskId) {
    if (!this._threads.get(threadId)) return null;
    const thread = this._threads.update(threadId, { task_id: taskId || null });
    this._emit(InboxService.CHANGED_EVENT, { threadId, reason: 'task' });
    return thread;
  }

  listNotifications({ limit = 100, offset = 0, app = null, since = null } = {}) {
    return this._notifications.listRecent({ limit, offset, app, since: since || null });
  }

  counts() {
    return this._threads.countByState();
  }

  _touchThread(app, threadKey, { title, participants, url, at }) {
    const existing = this._threads.findByKey(app, threadKey);
    if (!existing) return this._createThread(app, threadKey, { title, participants, url, at, count: 1 });
    const columns = {
      last_at: at,
      count: existing.count + 1,
      participants: [...new Set([...existing.participants, ...participants])],
    };
    if (!existing.title && title) columns.title = title;
    if (!existing.url && url) columns.url = url;
    if (InboxService._reopens(existing, at)) { columns.state = 'open'; columns.snooze_until = null; }
    return this._threads.update(existing.id, columns);
  }

  _createThread(app, threadKey, { title, participants, url, at, count }) {
    return this._threads.insert({
      id: RecordId.create(InboxService.THREAD_PREFIX),
      app,
      threadKey,
      title: title || '',
      participants: participants || [],
      firstAt: at,
      lastAt: at,
      count,
      url: url || '',
    });
  }

  static _reopens(thread, atIso) {
    if (thread.state === 'reviewed' || thread.state === 'done') return true;
    return thread.state === 'snoozed' && (!thread.snoozeUntil || thread.snoozeUntil <= atIso);
  }

  static _enrichmentColumns(thread, e) {
    const columns = {};
    if (e.title != null && String(e.title).trim()) columns.title = String(e.title).trim();
    if (e.summary != null) columns.summary = String(e.summary);
    if (e.priority != null) {
      if (!ThreadRepository.PRIORITIES.includes(e.priority)) throw new Error(`unknown priority "${e.priority}"`);
      columns.priority = e.priority;
    }
    if (Array.isArray(e.labels)) columns.labels = e.labels.map(String);
    if (e.context && typeof e.context === 'object') columns.context = { ...thread.context, ...e.context };
    if (Array.isArray(e.participants)) columns.participants = [...new Set([...thread.participants, ...e.participants.map(String)])];
    if (e.url != null && String(e.url)) columns.url = String(e.url);
    if (e.taskId !== undefined) columns.task_id = e.taskId || null;
    if (e.state != null) {
      if (!ThreadRepository.STATES.includes(e.state)) throw new Error(`unknown thread state "${e.state}"`);
      columns.state = e.state;
    }
    return columns;
  }

  _snoozeTime(snoozeUntil) {
    const now = this._now();
    if (!snoozeUntil) return new Date(now.getTime() + InboxService.DEFAULT_SNOOZE_MS).toISOString();
    const t = Date.parse(snoozeUntil);
    if (!Number.isFinite(t) || t <= now.getTime()) throw new Error('snoozeUntil must be a future ISO time');
    return new Date(t).toISOString();
  }

  static _dedupeKey(n, classified, scope, now) {
    if (n.tag) return `notif:${scope}:${n.tag}`;
    const minute = now.toISOString().slice(0, 16);
    const hash = crypto.createHash('sha1').update(`${n.title || ''}\n${n.body || ''}\n${minute}`).digest('hex').slice(0, 16);
    return `notif:${scope}:${hash}`;
  }

  _pruneOccasionally(now) {
    this._ingested += 1;
    if (this._ingested % this._pruneEvery !== 0) return;
    this._notifications.pruneBefore(new Date(now.getTime() - this._retentionDays * 24 * 60 * 60 * 1000).toISOString());
  }

  _lastNotification(threadId) {
    const latest = this._notifications.listForThread(threadId, { limit: 1 })[0];
    return latest ? { title: latest.title, body: latest.body, receivedAt: latest.receivedAt, sender: latest.sender } : null;
  }

  static _isoOrNow(value, now) {
    const t = value ? Date.parse(value) : NaN;
    return Number.isFinite(t) ? new Date(t).toISOString() : now.toISOString();
  }
}

module.exports = InboxService;
