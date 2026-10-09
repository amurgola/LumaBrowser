class TestTabs {
  static NO_ACTIVE_TAB = 'No active tab';

  constructor(browserService) {
    this._browser = browserService;
  }

  async describeActive() {
    const tabs = await this._tabs();
    const tab = tabs.find((t) => t.id != null) || tabs[0];
    if (tab && tab.id != null) return `Tab ${tab.id}: ${tab.url} (${tab.title || 'untitled'})`;
    return TestTabs.NO_ACTIVE_TAB;
  }

  async hasValidTab() {
    return (await this._tabs()).some((t) => t.id != null);
  }

  async _tabs() {
    try {
      return TestTabs.listFrom(await this._browser.getTabs());
    } catch (_) {
      return [];
    }
  }

  static listFrom(result) {
    if (Array.isArray(result)) return result;
    return (result && (result.tabs || result.data)) || [];
  }
}

module.exports = TestTabs;
