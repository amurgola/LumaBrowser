class TabControl {
  constructor(tabViewManager) {
    this._tabViewManager = tabViewManager;
    this._updates = {
      navigate: (page, action) => this._tabViewManager.navigate(page.tabId, action.payload),
      refresh: (page) => this._tabViewManager.reload(page.tabId),
      executeJs: (page, action) => TabControl._executeJs(page, action.payload),
      activate: (page) => this._activate(page),
    };
  }

  getAllTabs(options = {}) {
    return TabControl._guard(() => ({
      success: true,
      tabs: this._tabViewManager.getAllTabs({ includeSilent: !!options.includeSilent }),
    }));
  }

  createTab(url, options = {}) {
    return TabControl._guard(() => ({ success: true, tab: this._tabViewManager.createTab(url, options) }));
  }

  getConsoleLogs(tabId, options = {}) {
    return TabControl._guard(() => ({ success: true, data: this._tabViewManager.getConsoleLogs(tabId, options) }));
  }

  update(page, action) {
    const handler = this._updates[action.type];
    if (!handler) return { success: false, error: `Unknown action type: ${action.type}` };
    return handler(page, action);
  }

  static async _executeJs(page, code) {
    const result = await page.webContents.executeJavaScript(code, false);
    return { success: true, data: { result } };
  }

  _activate(page) {
    const result = this._tabViewManager.switchToTab(page.tabId);
    if (result.success) return { success: true, data: { activeTabId: page.tabId } };
    return { success: false, error: page.entry.silent ? 'Silent tabs cannot be activated' : 'Failed to activate tab' };
  }

  static _guard(read) {
    try {
      return read();
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = TabControl;
