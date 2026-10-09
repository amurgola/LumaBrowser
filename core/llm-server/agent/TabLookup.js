class TabLookup {
  constructor(browserService) {
    this._browserService = browserService;
  }

  async describe(tabId) {
    const tab = await this._findTab(tabId);
    if (tab && tab.id != null) return `Tab ${tab.id}: ${tab.url} (${tab.title || 'untitled'})`;
    return `Tab ${tabId}: (unknown)`;
  }

  async currentUrl(tabId) {
    const tab = await this._findTab(tabId);
    return (tab && tab.url) || null;
  }

  async attachDigest(result, tabId) {
    if (tabId == null || !this._browserService.observePage) return;
    try {
      const digest = await this._browserService.observePage(tabId);
      if (digest && digest.success && digest.data && digest.data.text) result.pageElements = digest.data.text;
    } catch (_) {}
  }

  async _findTab(tabId) {
    try {
      const tabs = TabLookup._tabsOf(await this._browserService.getTabs());
      if (!tabs.length) return null;
      return tabs.find((tab) => tab.id === tabId) || tabs[0];
    } catch (_) {
      return null;
    }
  }

  static _tabsOf(result) {
    return result.tabs || result.data || (Array.isArray(result) ? result : []);
  }
}

module.exports = TabLookup;
