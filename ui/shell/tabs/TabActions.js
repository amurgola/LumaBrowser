export default class TabActions {
  static DEFAULT_START_PAGE = 'https://duckduckgo.com';

  static ZOOM_MIN = 0.3;

  static ZOOM_MAX = 3.0;

  constructor({ store, addressBar, closedTabs }) {
    this._store = store;
    this._addressBar = addressBar;
    this._closedTabs = closedTabs;
    this.startPageUrl = TabActions.DEFAULT_START_PAGE;
  }

  async create(url, options = {}) {
    if (!window.tabAPI) return null;
    const { focusUrl, ...rest } = options || {};
    const target = url || this.startPageUrl || TabActions.DEFAULT_START_PAGE;
    const result = await window.tabAPI.create(target, rest);
    const id = result && result.id != null ? result.id : null;
    if (focusUrl && this._addressBar) setTimeout(() => this._addressBar.focusAndSelect(), 0);
    return id;
  }

  async close(tabId) {
    if (!window.tabAPI) return;
    let res = null;
    try { res = await window.tabAPI.close(tabId); } catch (e) { res = { success: false, error: e.message }; }
    if (res && res.success === false && /last tab/i.test(res.error || '')) await this._replaceLastTab(tabId);
  }

  async switchTo(tabId) {
    if (!window.tabAPI) return;
    await window.tabAPI.switch(tabId);
  }

  navigate(url) {
    if (this._store.activeTabId === null || !window.tabAPI) return;
    window.tabAPI.navigate(this._store.activeTabId, url);
  }

  zoom(tabId, delta, reset = false) {
    if (tabId === null || tabId === undefined) return;
    const tab = this._store.get(tabId);
    if (!tab) return;
    tab.zoomLevel = TabActions.nextZoom(tab.zoomLevel, delta, reset);
    if (window.tabAPI) window.tabAPI.setZoom(tabId, tab.zoomLevel);
  }

  static nextZoom(current, delta, reset) {
    const next = reset ? 1.0 : Math.min(TabActions.ZOOM_MAX, Math.max(TabActions.ZOOM_MIN, current + delta));
    return Math.round(next * 100) / 100;
  }

  async syncZoom(tabId) {
    const tab = this._store.get(tabId);
    if (!tab || !window.tabAPI || typeof window.tabAPI.getZoom !== 'function') return;
    try {
      const z = await window.tabAPI.getZoom(tabId);
      if (typeof z === 'number' && z > 0) tab.zoomLevel = z;
      else if (z && typeof z.zoomLevel === 'number') tab.zoomLevel = z.zoomLevel;
    } catch (_) {}
  }

  reopenClosed() {
    const last = this._closedTabs.pop();
    if (last && last.url) this.create(last.url, { activate: true });
  }

  async _replaceLastTab(tabId) {
    const fresh = await this.create(undefined, { activate: true, focusUrl: true });
    if (fresh == null) return;
    try { await window.tabAPI.close(tabId); } catch (_) {}
  }
}
