class TabForeground {
  static PAINT_DELAY_MS = 50;

  constructor(browser) {
    this._tabViewManager = TabForeground._tabViewManagerOf(browser);
    this._previousTabId = null;
    this._switched = false;
  }

  async bringForward(tabId) {
    if (!this._tabViewManager) return;
    this._previousTabId = this._tabViewManager.getActiveTabId ? this._tabViewManager.getActiveTabId() : null;
    if (this._previousTabId === tabId) return;
    this._trySwitch(tabId);
    await new Promise((resolve) => setTimeout(resolve, TabForeground.PAINT_DELAY_MS));
  }

  restore(tabId) {
    if (!this._switched || this._previousTabId == null || this._previousTabId === tabId) return;
    try { this._tabViewManager.switchToTab(this._previousTabId); } catch (_) {}
  }

  _trySwitch(tabId) {
    try {
      this._tabViewManager.switchToTab(tabId);
      this._switched = true;
    } catch (_) {}
  }

  static _tabViewManagerOf(browser) {
    const tabManager = browser.getTabManager ? browser.getTabManager() : null;
    return tabManager ? tabManager.tabViewManager : null;
  }
}

module.exports = TabForeground;
