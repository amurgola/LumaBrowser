const path = require('path');
const { pathToFileURL } = require('url');
const InternalTabLoader = require('../../shell/InternalTabLoader');

class PinnedLlmTab {
  static GATEWAY_PATH = '/llm-ui/llm-tab.html';
  static TITLE = 'LLM';
  static KIND = 'llm';

  constructor({ rootDir, isEnabled }) {
    this._isEnabled = isEnabled;
    this.tabHtmlPath = path.join(rootDir, 'ui', 'llm-tab.html');
    this.tabHtmlFileUrl = pathToFileURL(this.tabHtmlPath).href;
    this.tabHtmlUrl = this.tabHtmlFileUrl;
    this.tabPreloadPath = path.join(rootDir, 'llm-tab-preload.js');
    this.tabViewManager = null;
    this.pinnedTabId = null;
    this.tabLoadedOk = false;
  }

  setWebBaseUrl(baseUrl) {
    if (!baseUrl) return;
    this.tabHtmlUrl = String(baseUrl).replace(/\/+$/, '') + PinnedLlmTab.GATEWAY_PATH;
  }

  attach(tabViewManager) {
    this.tabViewManager = tabViewManager;
    tabViewManager.on('tabClosed', (tabId) => {
      if (tabId === this.pinnedTabId) this.pinnedTabId = null;
    });
  }

  ensure({ activate = false } = {}) {
    if (!this._isEnabled() || !this.tabViewManager) return null;
    if (this._exists()) return this._reuse(activate);
    return this._create(activate);
  }

  remove() {
    if (this.pinnedTabId === null || !this.tabViewManager) return;
    const tabId = this.pinnedTabId;
    this.pinnedTabId = null;
    try {
      this.tabViewManager.closeTabInternal(tabId);
    } catch (err) {
      console.warn('[llm-server] removePinnedTab failed:', err.message);
    }
  }

  openIn(channel, payload = null) {
    const fresh = this.pinnedTabId === null;
    const tabId = this.ensure({ activate: true });
    if (tabId == null) return false;
    try {
      const wc = this._webContents(tabId);
      if (wc && !wc.isDestroyed()) PinnedLlmTab._deliver(wc, channel, payload, fresh);
    } catch (_) {}
    return true;
  }

  send(channel, payload) {
    if (this.pinnedTabId === null || !this.tabViewManager) return;
    try {
      const wc = this._webContents(this.pinnedTabId);
      if (wc && !wc.isDestroyed()) wc.send(channel, payload);
    } catch (_) {}
  }

  notifyGatewayReady() {
    if (!this._exists()) return;
    InternalTabLoader.reloadIfStale(this, this._webContents(this.pinnedTabId));
  }

  _exists() {
    return this.pinnedTabId !== null && !!this.tabViewManager && !!this.tabViewManager.getEntry(this.pinnedTabId);
  }

  _reuse(activate) {
    if (activate) {
      try { this.tabViewManager.switchToTab(this.pinnedTabId); } catch (_) {}
    }
    return this.pinnedTabId;
  }

  _create(activate) {
    const tab = this.tabViewManager.createTab(this.tabHtmlUrl, {
      pinned: true,
      kind: PinnedLlmTab.KIND,
      title: PinnedLlmTab.TITLE,
      activate,
      preloadPath: this.tabPreloadPath,
    });
    this.pinnedTabId = tab.id;
    const wc = this._webContents(tab.id);
    if (wc && !wc.isDestroyed()) InternalTabLoader.wire(this, wc);
    return tab.id;
  }

  _webContents(tabId) {
    return typeof this.tabViewManager.getWebContents === 'function' ? this.tabViewManager.getWebContents(tabId) : null;
  }

  static _deliver(wc, channel, payload, fresh) {
    if (fresh && typeof wc.once === 'function' && typeof wc.isLoading === 'function' && wc.isLoading()) {
      wc.once('did-finish-load', () => {
        try { if (!wc.isDestroyed()) wc.send(channel, payload); } catch (_) {}
      });
    } else {
      wc.send(channel, payload);
    }
  }
}

module.exports = PinnedLlmTab;
