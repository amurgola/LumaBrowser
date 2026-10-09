const TabKinds = require('../../core/browser/tab-view/TabKinds');

class HistoryRecorder {
  constructor({ tabViewManager, historyService, automationKinds = TabKinds.AUTOMATION, internalKinds = TabKinds.INTERNAL }) {
    this._tvm = tabViewManager;
    this._history = historyService;
    this._excludedKinds = [automationKinds, internalKinds];
    this._lastVisitByTab = new Map();
  }

  attach() {
    this._tvm.on('tabNavigated', (tabId, url) => this.onNavigated(tabId, url));
    this._tvm.on('tabTitleUpdated', (tabId, title) => this.onTitleUpdated(tabId, title));
    return this;
  }

  onNavigated(tabId, url) {
    const entry = this._tvm.tabs.get(tabId);
    if (!this._isUserBrowsing(entry)) return null;
    const visit = this._history.recordVisit(url, entry.title);
    if (visit) this._lastVisitByTab.set(tabId, visit.id);
    return visit;
  }

  onTitleUpdated(tabId, title) {
    const visitId = this._lastVisitByTab.get(tabId);
    if (!visitId) return false;
    this._history.updateVisitTitle(visitId, title);
    return true;
  }

  _isUserBrowsing(entry) {
    if (!entry || entry.silent || entry.hidden) return false;
    return !this._excludedKinds.some((kinds) => kinds.has(entry.kind));
  }
}

module.exports = HistoryRecorder;
