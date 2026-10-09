const NetworkWatcher = require('./NetworkWatcher');
const HeaderRedactor = require('./HeaderRedactor');
const WatcherWebhook = require('./WatcherWebhook');

class NetworkWatcherService {
  constructor(db) {
    this._db = db;
    this._watchers = new Map();
    this._changeListeners = new Set();
    this._loadWatchers();
  }

  onChange(listener) {
    this._changeListeners.add(listener);
    return () => this._changeListeners.delete(listener);
  }

  wantsBodyCapture() {
    return this.getAllWatchers().some((watcher) => watcher.enabled !== false && !!watcher.captureBody);
  }

  addWatcher(config) {
    this._assertUnique(config.urlPattern, config.method || '*');
    const watcher = new NetworkWatcher(config);
    this._db.addWatcher(watcher);
    this._watchers.set(watcher.id, watcher);
    this._notifyChange();
    return watcher;
  }

  updateWatcher(id, updates) {
    const current = this._watchers.get(id);
    if (!current) return null;
    const updated = new NetworkWatcher({ ...current.toJSON(), ...updates, id });
    this._db.updateWatcher(id, updated.toJSON());
    this._watchers.set(id, updated);
    this._notifyChange();
    return updated;
  }

  removeWatcher(id) {
    const deleted = this._db.removeWatcher(id);
    if (deleted) {
      this._watchers.delete(id);
      this._notifyChange();
    }
    return deleted;
  }

  setWatcherEnabled(id, enabled) {
    return this.updateWatcher(id, { enabled });
  }

  getWatcher(id) {
    return this._watchers.get(id);
  }

  getAllWatchers() {
    return Array.from(this._watchers.values());
  }

  findMatchingWatchers(url, method = 'GET') {
    return this.getAllWatchers().filter((watcher) => watcher.matches(url, method));
  }

  async forwardToWebhook(watcher, requestData) {
    try {
      const payload = NetworkWatcherService._buildPayload(watcher, requestData);
      this._recordCapture(watcher, payload);
      if (!watcher.sendTo) return WatcherWebhook.notForwarded();
      return await WatcherWebhook.post(watcher.sendTo, payload);
    } catch (error) {
      console.error('Failed to forward to webhook:', error);
      return WatcherWebhook.failed(error);
    }
  }

  getStats() {
    const watchers = this.getAllWatchers();
    return {
      total: watchers.length,
      enabled: watchers.filter((watcher) => watcher.enabled).length,
      disabled: watchers.filter((watcher) => !watcher.enabled).length,
      totalTriggers: watchers.reduce((sum, watcher) => sum + watcher.triggerCount, 0),
    };
  }

  _loadWatchers() {
    for (const data of this._db.getAllWatchers()) {
      try {
        const watcher = NetworkWatcher.fromJSON(data);
        this._watchers.set(watcher.id, watcher);
      } catch (error) {
        console.error('Failed to load watcher:', error);
      }
    }
  }

  _assertUnique(urlPattern, method) {
    if (this._db.hasWatcher(urlPattern, method)) {
      throw new Error(`A watcher for pattern "${urlPattern}" with method "${method}" already exists`);
    }
  }

  static _buildPayload(watcher, requestData) {
    return {
      watcherId: watcher.id,
      note: watcher.note,
      timestamp: new Date().toISOString(),
      request: HeaderRedactor.redactCapturePayload(requestData),
    };
  }

  _recordCapture(watcher, payload) {
    watcher.lastCapturedResponse = payload;
    watcher.recordTrigger();
    this._db.updateWatcher(watcher.id, {
      triggerCount: watcher.triggerCount,
      lastTriggered: watcher.lastTriggered,
      lastCapturedResponse: payload,
    });
  }

  _notifyChange() {
    for (const listener of this._changeListeners) {
      try {
        listener();
      } catch (err) {
        console.error('NetworkWatcherService change listener failed:', err && err.message);
      }
    }
  }
}

module.exports = NetworkWatcherService;
