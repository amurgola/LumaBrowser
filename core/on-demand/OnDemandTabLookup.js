const OnDemandPlacement = require('./OnDemandPlacement');

class OnDemandTabLookup {
  constructor(tabViewManager) {
    this._tvm = tabViewManager || null;
  }

  activeTabId() {
    try {
      if (typeof this._tvm.getActiveTabId === 'function') return this._tvm.getActiveTabId();
      return this._tvm.activeTabId;
    } catch (_) {
      return null;
    }
  }

  entry(tabId) {
    if (tabId == null || !this._tvm) return null;
    try {
      if (typeof this._tvm.getEntry === 'function') return this._tvm.getEntry(tabId) || null;
      return (this._tvm.tabs && this._tvm.tabs.get(tabId)) || null;
    } catch (_) {
      return null;
    }
  }

  activeEntry() {
    return this.entry(this.activeTabId());
  }

  tabInfo(tabId) {
    const entry = this.entry(tabId);
    return entry ? { url: entry.url || '', title: entry.title || '' } : null;
  }

  pageRect() {
    return OnDemandPlacement.pageRect(this._tvm && this._tvm.currentBounds);
  }

  static isWebPage(entry) {
    return Boolean(entry) && (entry.kind || 'user') === 'user';
  }

  static isShownPage(entry) {
    return OnDemandTabLookup.isWebPage(entry) && !entry.silent && !entry.hidden;
  }
}

module.exports = OnDemandTabLookup;
