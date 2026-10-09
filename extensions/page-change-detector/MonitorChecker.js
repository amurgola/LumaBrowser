const RecordId = require('../../core/database/RecordId');
const ChangeDiff = require('./ChangeDiff');

class MonitorChecker {
  static LOAD_TIMEOUT_MS = 5000;
  static PREVIEW_CHARS = 500;
  static EVENT_PREVIEW_CHARS = 2000;
  static NOTIFICATION_DIFF_CHARS = 200;
  static IN_PROGRESS = 'Check already in progress';
  static NO_OPEN_TAB = 'No open tab matches this URL. Open the page in a tab so it can be watched without reloading.';
  static UNREADABLE = 'Could not read the page text. The page may still be loading or blocked the request.';

  constructor({ monitors, snapshots, tabs, extractor, webhook, notifier, broadcast, now = () => new Date() }) {
    this._monitors = monitors;
    this._snapshots = snapshots;
    this._tabs = tabs;
    this._extractor = extractor;
    this._webhook = webhook;
    this._notifier = notifier;
    this._broadcast = broadcast;
    this._now = now;
    this._checking = new Set();
    this._listeners = [];
  }

  async check(monitor) {
    if (this._checking.has(monitor.id)) return { changed: false, skipped: true, error: MonitorChecker.IN_PROGRESS };
    this._begin(monitor.id);
    try {
      return await this._run(monitor);
    } catch (error) {
      return this._recordFailure(monitor, error);
    } finally {
      this._end(monitor.id);
    }
  }

  onChange(callback) {
    if (typeof callback !== 'function') return () => {};
    this._listeners.push(callback);
    return () => {
      const i = this._listeners.indexOf(callback);
      if (i >= 0) this._listeners.splice(i, 1);
    };
  }

  reset() {
    this._checking.clear();
  }

  _begin(id) {
    this._checking.add(id);
    this._monitors.update(id, { status: 'checking' });
    this._broadcast.emit('check-started', id);
  }

  _end(id) {
    this._checking.delete(id);
    this._monitors.update(id, { status: 'idle' });
    this._broadcast.emit('check-finished', id);
  }

  async _run(monitor) {
    const tabId = await this._resolveTab(monitor);
    if (tabId === null) return this._recordNoTab(monitor);
    const text = await this._extractor.extract(tabId, monitor);
    if (text === null) return this._recordUnreadable(monitor);
    const snapshot = this._recordSnapshot(monitor, text);
    if (!snapshot.changed) return { changed: false, diffSummary: snapshot.diffSummary };
    return this._handleChange(monitor, text, snapshot);
  }

  async _resolveTab(monitor) {
    if (monitor.no_refresh_required) return (await this._tabs.findExisting(monitor.url, { includeSilent: true })) || null;
    const tabId = await this._tabs.findOrCreate(monitor.url, { silent: true, allowSilentMatch: true });
    await this._tabs.waitForLoad(tabId, MonitorChecker.LOAD_TIMEOUT_MS);
    return tabId;
  }

  _recordNoTab(monitor) {
    console.log(`page-change-detector: skipping "${monitor.name}": ${MonitorChecker.NO_OPEN_TAB}`);
    this._monitors.update(monitor.id, { last_status: 'error', last_error: MonitorChecker.NO_OPEN_TAB });
    return { changed: false, skipped: true, error: MonitorChecker.NO_OPEN_TAB };
  }

  _recordUnreadable(monitor) {
    console.error(`page-change-detector: failed to extract text from ${monitor.url}`);
    this._monitors.update(monitor.id, { last_run: this._now().toISOString(), last_status: 'error', last_error: MonitorChecker.UNREADABLE });
    return { changed: false, error: MonitorChecker.UNREADABLE };
  }

  _recordFailure(monitor, error) {
    console.error(`page-change-detector: check failed for "${monitor.name}":`, error.message);
    this._monitors.update(monitor.id, { last_run: this._now().toISOString(), last_status: 'error', last_error: error.message });
    return { changed: false, error: error.message };
  }

  _recordSnapshot(monitor, text) {
    const checksum = ChangeDiff.checksum(text);
    const checkedAt = this._now().toISOString();
    const previous = this._snapshots.latest(monitor.id);
    const prevChecksum = previous ? previous.checksum : null;
    const changed = prevChecksum !== checksum;
    const diffSummary = changed ? ChangeDiff.summarize((previous && previous.text_preview) || '', text) : '';
    this._snapshots.insert({
      id: RecordId.create('snap'), monitor_id: monitor.id, checksum, changed: changed ? 1 : 0, checked_at: checkedAt,
      text_length: text.length, text_preview: text.substring(0, MonitorChecker.PREVIEW_CHARS), diff_summary: diffSummary || null,
    });
    this._monitors.recordRead(monitor.id, { checkedAt, checksum });
    return { checksum, prevChecksum, changed, diffSummary, checkedAt };
  }

  async _handleChange(monitor, text, snapshot) {
    const changeCount = this._monitors.changeCount(monitor.id) + 1;
    this._monitors.incrementChangeCount(monitor.id);
    console.log(`page-change-detector: change detected in "${monitor.name}" (${monitor.url})`);
    const event = MonitorChecker._changeEvent(monitor, text, snapshot, changeCount);
    this._notifyListeners(event);
    this._notifyDesktop(monitor, snapshot.diffSummary);
    return { changed: true, diffSummary: snapshot.diffSummary, ...(await this._sendWebhook(monitor, event)) };
  }

  _notifyListeners(event) {
    for (const listener of this._listeners.slice()) {
      try { listener(event); } catch (_) {}
    }
  }

  _notifyDesktop(monitor, diffSummary) {
    if (!monitor.desktop_notifications) return;
    this._notifier.show(`Change detected: ${monitor.name}`,
      `${diffSummary.substring(0, MonitorChecker.NOTIFICATION_DIFF_CHARS)}\n${monitor.url}`);
  }

  async _sendWebhook(monitor, event) {
    if (!monitor.webhook_url) return {};
    const failure = await this._webhook.send(monitor.webhook_url, event);
    if (!failure) return {};
    const error = `Webhook failed: ${failure}`;
    this._monitors.update(monitor.id, { last_status: 'error', last_error: error });
    return { error };
  }

  static _changeEvent(monitor, text, snapshot, changeCount) {
    return {
      monitorId: monitor.id,
      monitorName: monitor.name,
      url: monitor.url,
      timestamp: snapshot.checkedAt,
      checksum: snapshot.checksum,
      prevChecksum: snapshot.prevChecksum,
      diffSummary: snapshot.diffSummary || '',
      textPreview: text.substring(0, MonitorChecker.EVENT_PREVIEW_CHARS),
      textLength: text.length,
      changeCount,
    };
  }
}

module.exports = MonitorChecker;
