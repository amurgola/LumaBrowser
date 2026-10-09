class MonitorTabs {
  static LOAD_POLL_MS = 500;

  constructor(browser, { sleep = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
    this._browser = browser;
    this._sleep = sleep;
  }

  async findExisting(url, { includeSilent = true } = {}) {
    const result = await this._listTabs(includeSilent);
    if (!result || !result.success || !Array.isArray(result.tabs)) return null;
    const tab = result.tabs.find((t) => t.url && t.url.startsWith(url));
    return tab ? tab.id : null;
  }

  async findOrCreate(url, { silent = false, allowSilentMatch = true } = {}) {
    const existing = await this.findExisting(url, { includeSilent: allowSilentMatch });
    if (existing) return existing;
    const created = await this._browser.createTab(url, { silent: !!silent });
    if (created && created.success && created.tab) return created.tab.id;
    throw new Error(`Failed to create tab for ${url}`);
  }

  async waitForLoad(tabId, timeoutMs) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (await this._isComplete(tabId)) return;
      await this._sleep(MonitorTabs.LOAD_POLL_MS);
    }
  }

  async bringToFront(tabId) {
    try {
      const manager = this._tabManager();
      if (manager && typeof manager.updateTab === 'function') await manager.updateTab(tabId, { type: 'activate' });
    } catch (_) {}
  }

  async _isComplete(tabId) {
    try {
      const result = await this._browser.executeJs(tabId, 'document.readyState');
      return !!(result && result.data && result.data.result === 'complete');
    } catch (_) {
      return false;
    }
  }

  async _listTabs(includeSilent) {
    const manager = this._tabManager();
    if (manager && typeof manager.getAllTabs === 'function') return manager.getAllTabs({ includeSilent });
    return this._browser.getTabs();
  }

  _tabManager() {
    return typeof this._browser.getTabManager === 'function' ? this._browser.getTabManager() : null;
  }
}

module.exports = MonitorTabs;
