const DashboardSnapshot = require('../../dashboard/DashboardSnapshot');

class PageContextActions {
  static MAX_CHARS = 60000;

  static MAX_TABS = 40;

  static WEB_URL = /^(https?|file):/i;

  static UNAVAILABLE = 'The browser is not ready yet.';

  constructor(deps, { snapshot = null } = {}) {
    this._deps = deps;
    const get = (name) => (deps && typeof deps.get === 'function' ? deps.get(name) : null);
    this._snapshot = snapshot || new DashboardSnapshot({
      dashboardService: get('dashboardService'),
      getAgentDeps: () => deps.agentDeps(),
      getExtensionManager: () => {
        const getter = get('getExtensionManager');
        return typeof getter === 'function' ? getter() : null;
      },
    });
  }

  async listTabs() {
    const browser = this._browser();
    if (!browser) return { tabs: [] };
    const r = await browser.getTabs();
    const tabs = (r && Array.isArray(r.tabs) ? r.tabs : [])
      .filter((t) => t && PageContextActions.WEB_URL.test(String(t.url || '')) && !t.errorPage)
      .map((t) => ({
        id: t.id,
        title: String(t.title || t.url || ''),
        url: String(t.url || ''),
        favicon: typeof t.favicon === 'string' ? t.favicon : null,
        lastActivatedAt: t.lastActivatedAt || null,
      }));
    tabs.sort((a, b) => (b.lastActivatedAt || 0) - (a.lastActivatedAt || 0));
    return { tabs: tabs.slice(0, PageContextActions.MAX_TABS) };
  }

  async readTab(tabId) {
    const browser = this._browser();
    if (!browser) return { success: false, error: PageContextActions.UNAVAILABLE };
    const id = Number(tabId);
    const list = await this.listTabs();
    const tab = list.tabs.find((t) => t.id === id);
    if (!tab) return { success: false, error: 'That tab is no longer open.' };
    const text = await this._readText(browser, id);
    if (!text) return { success: false, error: 'The page has no readable text.' };
    const truncated = text.length > PageContextActions.MAX_CHARS;
    return {
      tab: { id: tab.id, title: tab.title, url: tab.url },
      text: truncated ? text.slice(0, PageContextActions.MAX_CHARS) : text,
      chars: text.length,
      truncated,
    };
  }

  async readDashboard() {
    return this._snapshot.read();
  }

  async _readText(browser, id) {
    for (const type of ['markdown', 'text']) {
      try {
        const r = await browser.getSource(id, { type });
        const s = r && r.success !== false && typeof r.source === 'string' ? r.source.trim() : '';
        if (s) return s;
      } catch (_) {}
    }
    return '';
  }

  _browser() {
    const agentDeps = this._deps.agentDeps();
    return (agentDeps && agentDeps.browserService) || null;
  }
}

module.exports = PageContextActions;
