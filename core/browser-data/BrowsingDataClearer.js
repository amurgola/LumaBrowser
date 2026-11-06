class BrowsingDataClearer {
  static RANGES = { hour: 60 * 60 * 1000, day: 24 * 60 * 60 * 1000, week: 7 * 24 * 60 * 60 * 1000, month: 28 * 24 * 60 * 60 * 1000, all: null };
  static SHARED_PARTITION = 'persist:main';

  constructor({ history, getTabViewManager, sessionFor, now = () => Date.now() }) {
    this._history = history;
    this._tvm = getTabViewManager || (() => null);
    this._sessionFor = sessionFor;
    this._now = now;
  }

  async clear(what = {}) {
    const span = Object.prototype.hasOwnProperty.call(BrowsingDataClearer.RANGES, what.range) ? BrowsingDataClearer.RANGES[what.range] : null;
    const since = span == null ? null : new Date(this._now() - span).toISOString();
    const cleared = [];
    if (what.history) {
      this._history.clear(since ? { since } : {});
      cleared.push('history');
    }
    if (what.downloads) {
      const tvm = this._tvm();
      if (tvm && tvm.downloads) tvm.downloads.clearFinished(since ? Date.parse(since) : null);
      cleared.push('downloads');
    }
    const sessions = (what.cookies || what.cache) ? this._sessions() : [];
    if (what.cookies) {
      await Promise.all(sessions.map((s) => s.clearStorageData().catch(() => {})));
      cleared.push('cookies');
    }
    if (what.cache) {
      await Promise.all(sessions.map((s) => s.clearCache().catch(() => {})));
      cleared.push('cache');
    }
    return { success: true, cleared };
  }

  _sessions() {
    const out = new Set();
    try { out.add(this._sessionFor(BrowsingDataClearer.SHARED_PARTITION)); } catch (_) {}
    const tvm = this._tvm();
    if (tvm && tvm.tabs) {
      for (const entry of tvm.tabs.values()) {
        if (entry && typeof entry.isRegularBrowsing === 'function' && entry.isRegularBrowsing() && entry.webContents) out.add(entry.webContents.session);
      }
    }
    return [...out].filter(Boolean);
  }
}

module.exports = BrowsingDataClearer;
