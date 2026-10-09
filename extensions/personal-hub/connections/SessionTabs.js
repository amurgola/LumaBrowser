const SessionCookies = require('../calendar/session/SessionCookies');

class SessionTabs {
  static PARTITION_PREFIX = 'persist:hub-';
  static LOAD_TIMEOUT_MS = 30000;
  static WAKE_JS = `(() => {
  try {
    window.dispatchEvent(new Event('focus'));
    document.dispatchEvent(new Event('visibilitychange'));
  } catch (_) {}
  return true;
})()`;

  constructor({ browser = null, getCookies = SessionCookies.reader() } = {}) {
    this._browser = browser;
    this._getCookies = getCookies;
  }

  available() {
    return !!this._tabs();
  }

  persisted() {
    const tabs = this._tabs();
    if (!tabs) return [];
    let list;
    try { list = tabs.getPersistedTabs() || []; } catch (_) { return []; }
    return list.map((tab) => {
      const entry = tabs.getEntry(tab.id);
      return {
        tabId: tab.id,
        partition: (entry && entry.partition) || SessionCookies.DEFAULT_PARTITION,
        url: tab.url || '',
        host: SessionTabs.hostOf(tab.url),
        title: tab.title || '',
        hidden: !!tab.hidden,
        active: !!tab.active,
        loading: !!tab.loading,
      };
    });
  }

  async cookies(partition, domain) {
    try {
      const cookies = await this._getCookies({ partition, domain });
      return Array.isArray(cookies) ? cookies : [];
    } catch (_) {
      return [];
    }
  }

  async run(tabId, code, { gesture = false } = {}) {
    const wc = this._webContents(tabId);
    if (!wc) throw new Error('The tab is no longer open.');
    return wc.executeJavaScript(code, gesture);
  }

  async wake(tabId) {
    try { await this.run(tabId, SessionTabs.WAKE_JS, { gesture: true }); } catch (_) {}
  }

  async reload(tabId) {
    const tabs = this._tabs();
    const wc = this._webContents(tabId);
    if (!tabs || !wc) return false;
    try {
      wc.reload();
      if (typeof tabs.waitForLoad === 'function') await tabs.waitForLoad(tabId, SessionTabs.LOAD_TIMEOUT_MS);
      return true;
    } catch (_) {
      return false;
    }
  }

  show(tabId) {
    const tabs = this._tabs();
    if (!tabs) return { success: false, error: 'The browser is not available.' };
    const result = typeof tabs.showTab === 'function' ? tabs.showTab(tabId) : tabs.switchToTab(tabId);
    return result && result.success === false ? result : { success: true };
  }

  async openPersisted(url, now = Date.now()) {
    if (!this._browser || typeof this._browser.createTab !== 'function') return { success: false, error: 'The browser is not available.' };
    const partition = `${SessionTabs.PARTITION_PREFIX}${now.toString(36)}`;
    const created = await this._browser.createTab(String(url), { kind: 'user', partition });
    const tab = created && (created.tab || created);
    const tabs = this._tabs();
    if (tab && tab.id != null && tabs) tabs.setTabPersistence(tab.id, true);
    return { success: true, tabId: tab ? tab.id : null, partition };
  }

  onNavigated(listener) {
    if (!this._browser || typeof this._browser.onTabNavigated !== 'function') return () => {};
    return this._browser.onTabNavigated((...args) => {
      try { listener(SessionTabs._navigation(args)); } catch (_) {}
    });
  }

  static hostOf(url) {
    try { return new URL(String(url || '')).hostname.toLowerCase(); } catch (_) { return ''; }
  }

  static _navigation(args) {
    const [first, second] = args;
    if (first && typeof first === 'object') return { tabId: first.tabId != null ? first.tabId : first.id, url: first.url || '' };
    return { tabId: first, url: second || '' };
  }

  _tabs() {
    const browser = this._browser;
    if (!browser || typeof browser.getTabManager !== 'function') return null;
    const manager = browser.getTabManager();
    const tabs = manager && manager.tabViewManager;
    return tabs && typeof tabs.getPersistedTabs === 'function' ? tabs : null;
  }

  _webContents(tabId) {
    const tabs = this._tabs();
    const wc = tabs ? tabs.getWebContents(tabId) : null;
    return wc && !(typeof wc.isDestroyed === 'function' && wc.isDestroyed()) ? wc : null;
  }
}

module.exports = SessionTabs;
