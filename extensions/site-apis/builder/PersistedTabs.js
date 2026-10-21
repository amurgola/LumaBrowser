const BuilderMeta = require('./BuilderMeta');

class PersistedTabs {
  static DEFAULT_PARTITION = 'persist:main';

  static list(browser) {
    const tabs = PersistedTabs._viewManager(browser);
    if (!tabs) return [];
    let list;
    try { list = tabs.getPersistedTabs() || []; } catch (_) { return []; }
    const out = [];
    for (const tab of list) {
      if (!tab) continue;
      const entry = typeof tabs.getEntry === 'function' ? tabs.getEntry(tab.id) : null;
      const origin = BuilderMeta.originOf(tab.url);
      if (!origin) continue;
      out.push({
        tabId: tab.id,
        partition: (entry && entry.partition) || PersistedTabs.DEFAULT_PARTITION,
        origin,
        url: tab.url || '',
        title: tab.title || '',
      });
    }
    return out;
  }

  static find(browser, tabId) {
    return PersistedTabs.list(browser).find((tab) => Number(tab.tabId) === Number(tabId)) || null;
  }

  static _viewManager(browser) {
    try {
      const manager = browser && typeof browser.getTabManager === 'function' ? browser.getTabManager() : null;
      return manager ? (manager.tabViewManager || null) : null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = PersistedTabs;
