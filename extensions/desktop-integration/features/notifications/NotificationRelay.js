const crypto = require('crypto');
const OsNotification = require('./OsNotification');
const AppFilter = require('./AppFilter');
const HubMapper = require('./HubMapper');

class NotificationRelay {
  static STATUSES = ['relayed', 'buffered', 'duplicate', 'filtered', 'invalid', 'error'];
  static MAX_BATCH = 100;
  static MAX_RECENT = 200;
  static MAX_PENDING = 100;
  static MAX_APPS = 500;
  static RECENT_BODY = 500;
  static APPS_KEY = 'appsSeen';
  static PERSIST_DELAY_MS = 5000;
  static DEFAULTS = { forwardToHub: true, filterMode: 'all', allowApps: '', denyApps: '', ignoreLuma: true, dedupeWindowSec: 120 };

  constructor({ settings, getHub = () => null, broadcast = () => {}, log = {}, now = () => new Date(), setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
    this._settings = settings;
    this._getHub = getHub;
    this._broadcast = broadcast;
    this._log = log;
    this._now = now;
    this._setTimer = setTimer;
    this._clearTimer = clearTimer;
    this._recent = [];
    this._pending = [];
    this._seenKeys = new Map();
    this._apps = new Map();
    this._seq = 0;
    this._persistTimer = null;
    this._loadApps();
  }

  static itemsOf(body) {
    if (Array.isArray(body)) return body;
    if (body && typeof body === 'object') return Array.isArray(body.notifications) ? body.notifications : [body];
    return null;
  }

  config() {
    const get = (key) => this._settings.get(key, NotificationRelay.DEFAULTS[key]);
    const window = Number(get('dedupeWindowSec'));
    return {
      forwardToHub: get('forwardToHub') !== false,
      filterMode: AppFilter.MODES.includes(get('filterMode')) ? get('filterMode') : 'all',
      allowApps: AppFilter.parseList(get('allowApps')),
      denyApps: AppFilter.parseList(get('denyApps')),
      ignoreLuma: get('ignoreLuma') !== false,
      dedupeWindowSec: Number.isFinite(window) && window >= 0 ? window : NotificationRelay.DEFAULTS.dedupeWindowSec,
    };
  }

  hubAvailable() {
    return Boolean(this._hub());
  }

  ingest(list, { client = '' } = {}) {
    const items = Array.isArray(list) ? list.slice(0, NotificationRelay.MAX_BATCH) : [];
    const cfg = this.config();
    const filter = new AppFilter({ mode: cfg.filterMode, allow: cfg.allowApps, deny: cfg.denyApps, ignoreSelf: cfg.ignoreLuma });
    if (cfg.forwardToHub) this._flushPending();
    const results = items.map((raw, index) => ({ index, ...this._one(raw, client, filter, cfg) }));
    const counts = Object.fromEntries(NotificationRelay.STATUSES.map((s) => [s, 0]));
    for (const r of results) counts[r.status] += 1;
    return { received: items.length, truncated: Array.isArray(list) && list.length > items.length, counts, results };
  }

  flush() {
    const flushed = this._flushPending();
    return { flushed, pending: this._pending.length };
  }

  recent({ limit = 50, status = '' } = {}) {
    const n = Math.max(1, Math.min(NotificationRelay.MAX_RECENT, Number(limit) || 50));
    const rows = status ? this._recent.filter((r) => r.status === status) : this._recent;
    return rows.slice(0, n).map((r) => ({ ...r }));
  }

  apps() {
    return [...this._apps.values()].sort((a, b) => String(b.lastAt).localeCompare(String(a.lastAt))).map((a) => ({ ...a }));
  }

  pendingCount() {
    return this._pending.length;
  }

  dispose() {
    if (this._persistTimer) {
      this._clearTimer(this._persistTimer);
      this._persistTimer = null;
      this._saveApps();
    }
  }

  _one(raw, client, filter, cfg) {
    const now = this._now();
    const norm = OsNotification.normalize(raw, { now, client });
    if (!norm.ok) return { status: 'invalid', error: norm.error };
    const item = norm.item;
    const hubApp = HubMapper.hubAppFor(item);
    const app = this._countApp(item, hubApp);
    const decision = filter.decide(item, hubApp);
    if (!decision.allowed) {
      app.filtered += 1;
      return this._record(item, hubApp, 'filtered', { reason: decision.reason });
    }
    if (this._isDuplicate(item, now, cfg.dedupeWindowSec * 1000)) {
      app.duplicates += 1;
      return this._record(item, hubApp, 'duplicate', {});
    }
    if (!cfg.forwardToHub) {
      app.filtered += 1;
      return this._record(item, hubApp, 'filtered', { reason: 'forwarding-off' });
    }
    if (!this._hub()) {
      this._buffer(item);
      app.buffered += 1;
      const r = this._record(item, hubApp, 'buffered', { reason: 'hub-unavailable' });
      this._announce(r);
      return r;
    }
    try {
      const pushed = this._push(item);
      app.relayed += 1;
      const r = this._record(item, hubApp, 'relayed', { threadId: pushed.threadId });
      this._announce(r);
      return r;
    } catch (err) {
      app.errors += 1;
      return this._record(item, hubApp, 'error', { error: (err && err.message) || String(err) });
    }
  }

  _hub() {
    let hub = null;
    try { hub = this._getHub(); } catch (_) { hub = null; }
    return hub && typeof hub.pushQueueItem === 'function' ? hub : null;
  }

  _push(item) {
    const out = this._hub().pushQueueItem(HubMapper.toQueueItem(item)) || {};
    return { threadId: (out.thread && out.thread.id) || null };
  }

  _buffer(item) {
    this._pending.push(item);
    if (this._pending.length > NotificationRelay.MAX_PENDING) this._pending.splice(0, this._pending.length - NotificationRelay.MAX_PENDING);
  }

  _flushPending() {
    if (!this._pending.length || !this._hub() || !this.config().forwardToHub) return 0;
    let flushed = 0;
    while (this._pending.length) {
      const item = this._pending[0];
      try {
        const pushed = this._push(item);
        this._pending.shift();
        flushed += 1;
        this._markFlushed(item, pushed.threadId);
      } catch (err) {
        if (this._log.warn) this._log.warn('flushing buffered OS notifications failed', { error: (err && err.message) || String(err) });
        break;
      }
    }
    return flushed;
  }

  _markFlushed(item, threadId) {
    const row = this._recent.find((r) => r._item === item);
    const entry = this._apps.get(NotificationRelay._appKey(item));
    if (entry) { entry.buffered = Math.max(0, entry.buffered - 1); entry.relayed += 1; }
    if (!row) return;
    row.status = 'relayed';
    row.threadId = threadId;
    row.reason = 'flushed';
    this._announce(row);
  }

  _isDuplicate(item, now, windowMs) {
    const t = now.getTime();
    for (const [key, at] of this._seenKeys) if (t - at > windowMs) this._seenKeys.delete(key);
    if (windowMs <= 0) return false;
    const scope = (item.appId || item.app).toLowerCase();
    const key = item.tag
      ? `${scope}|t|${item.group}|${item.tag}`
      : `${scope}|h|${crypto.createHash('sha1').update(`${item.title}\n${item.body}`).digest('hex')}`;
    if (this._seenKeys.has(key)) return true;
    this._seenKeys.set(key, t);
    return false;
  }

  _record(item, hubApp, status, extra) {
    this._seq += 1;
    const row = {
      id: `osn_${this._now().getTime().toString(36)}_${this._seq}`,
      status,
      receivedAt: item.receivedAt,
      at: item.at,
      app: item.app,
      appId: item.appId,
      hubApp: hubApp || '',
      title: item.title,
      body: item.body.slice(0, NotificationRelay.RECENT_BODY),
      tag: item.tag,
      group: item.group,
      client: item.client,
      threadId: null,
      reason: '',
      ...extra,
    };
    Object.defineProperty(row, '_item', { value: item, enumerable: false });
    this._recent.unshift(row);
    if (this._recent.length > NotificationRelay.MAX_RECENT) this._recent.length = NotificationRelay.MAX_RECENT;
    const out = { status: row.status, id: row.id };
    for (const k of ['threadId', 'reason', 'error']) if (row[k]) out[k] = row[k];
    return out;
  }

  _announce(result) {
    const row = this._recent.find((r) => r.id === result.id) || result;
    try { this._broadcast('relayed', { ...row }); } catch (_) {}
  }

  static _appKey(item) {
    return (item.appId || item.app).toLowerCase();
  }

  _countApp(item, hubApp) {
    const key = NotificationRelay._appKey(item);
    let entry = this._apps.get(key);
    if (!entry) {
      entry = { app: item.app, appId: item.appId, hubApp: hubApp || '', count: 0, relayed: 0, buffered: 0, filtered: 0, duplicates: 0, errors: 0, firstAt: item.receivedAt, lastAt: item.receivedAt };
      this._apps.set(key, entry);
      this._trimApps();
    }
    entry.app = item.app || entry.app;
    entry.count += 1;
    entry.lastAt = item.receivedAt;
    this._schedulePersist();
    return entry;
  }

  _trimApps() {
    if (this._apps.size <= NotificationRelay.MAX_APPS) return;
    const oldest = [...this._apps.entries()].sort((a, b) => String(a[1].lastAt).localeCompare(String(b[1].lastAt)))[0];
    if (oldest) this._apps.delete(oldest[0]);
  }

  _schedulePersist() {
    if (this._persistTimer) return;
    this._persistTimer = this._setTimer(() => { this._persistTimer = null; this._saveApps(); }, NotificationRelay.PERSIST_DELAY_MS);
    if (this._persistTimer && typeof this._persistTimer.unref === 'function') this._persistTimer.unref();
  }

  _saveApps() {
    try { this._settings.set(NotificationRelay.APPS_KEY, this.apps()); } catch (_) {}
  }

  _loadApps() {
    let saved = [];
    try { saved = this._settings.get(NotificationRelay.APPS_KEY, []) || []; } catch (_) { saved = []; }
    if (!Array.isArray(saved)) return;
    for (const a of saved.slice(0, NotificationRelay.MAX_APPS)) {
      if (!a || typeof a !== 'object' || (!a.app && !a.appId)) continue;
      const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
      this._apps.set(String(a.appId || a.app).toLowerCase(), {
        app: String(a.app || a.appId), appId: String(a.appId || ''), hubApp: String(a.hubApp || ''),
        count: num(a.count), relayed: num(a.relayed), buffered: 0, filtered: num(a.filtered), duplicates: num(a.duplicates), errors: num(a.errors),
        firstAt: a.firstAt || null, lastAt: a.lastAt || null,
      });
    }
  }
}

module.exports = NotificationRelay;
