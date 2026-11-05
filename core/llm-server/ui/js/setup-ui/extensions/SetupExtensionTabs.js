import ExtensionTabNav from './ExtensionTabNav.js';
import ExtensionScriptLoader from './ExtensionScriptLoader.js';

export default class SetupExtensionTabs {
  static GLOBAL = 'LumaSetupExt';

  static RESYNC_MIN_MS = 3000;

  static URL_EXT_ID = /^\/llm-ui\/ext\/([^/]+)\//;

  static REGISTER_TIMEOUT_MS = 20000;

  static BUNDLE_FAILED = 'the extension UI bundle could not be loaded from the local API server';

  static BUNDLE_SILENT = 'the extension UI loaded but never registered its tab; the developer console may show why';

  static NO_BUNDLE = 'the extension declares no UI bundle for this tab';

  constructor({ api, doc = document, win = window, navigator = null }) {
    this._api = api;
    this._doc = doc;
    this._win = win;
    this._navigator = navigator;
    this._tabNav = new ExtensionTabNav(doc);
    this._loader = new ExtensionScriptLoader(doc);
    this._defs = new Map();
    this._urlByTab = new Map();
    this._pendingShow = new Set();
    this._failed = new Map();
    this._registerTimers = new Map();
    this._syncing = null;
    this._lastSyncAt = 0;
  }

  attachNavigator(navigator) {
    this._navigator = navigator;
  }

  start() {
    this._win[SetupExtensionTabs.GLOBAL] = this.registry();
    this._bindLiveHooks();
    return this.sync();
  }

  registry() {
    return {
      registerTab: (def) => this.registerTab(def),
      _show: (tabId) => this.show(tabId),
      refresh: () => this.sync(),
    };
  }

  registerTab(def) {
    if (!def || !def.id) return;
    this._clearRegisterTimer(def.id);
    this._defs.set(def.id, { mount: def.mount, onShow: def.onShow, mounted: false });
    if (this._pendingShow.has(def.id)) {
      this._pendingShow.delete(def.id);
      this._mount(def.id);
    }
  }

  show(tabId) {
    const def = this._defs.get(tabId);
    if (!def) { this._pendingShow.add(tabId); return; }
    this._mount(tabId);
    if (typeof def.onShow === 'function') { try { def.onShow(); } catch (_) {} }
  }

  sync() {
    if (!this._api || !this._api.setup || typeof this._api.setup.listTabs !== 'function') return Promise.resolve();
    if (this._syncing) return this._syncing;
    this._syncing = this._syncOnce().finally(() => { this._syncing = null; });
    return this._syncing;
  }

  async _syncOnce() {
    let res;
    try { res = await this._api.setup.listTabs(); } catch (_) { return; }
    const tabs = (res && res.success && Array.isArray(res.tabs)) ? res.tabs : [];
    const hosts = this._tabNav.hosts();
    if (!hosts) return;
    const wanted = this._addMissing(hosts, tabs);
    for (const id of this._tabNav.ids()) if (!wanted.has(id)) this._removeTab(hosts.nav, id);
    this._lastSyncAt = Date.now();
    if (this._navigator) { try { this._navigator.flushPending(); } catch (_) {} }
  }

  _addMissing(hosts, tabs) {
    const wanted = new Set();
    for (const tab of tabs) {
      if (!tab || !tab.id) continue;
      wanted.add(tab.id);
      if (!this._tabNav.has(tab.id)) this._addTab(hosts, tab);
    }
    return wanted;
  }

  _addTab(hosts, tab) {
    this._tabNav.add(hosts, tab);
    this._urlByTab.set(tab.id, tab.url || '');
    if (!tab.url) { this._setPane(tab.id, ExtensionTabNav.failedHtml(SetupExtensionTabs.NO_BUNDLE)); return; }
    if (this._servedFromFile()) { this._setPane(tab.id, ExtensionTabNav.OFFLINE_HTML); return; }
    this._loader.inject(tab.url, tab.module === true, () => this._bundleFailed(tab.id, SetupExtensionTabs.BUNDLE_FAILED));
    if (this._defs.has(tab.id)) return;
    if (this._failed.has(tab.id)) this._setPane(tab.id, ExtensionTabNav.failedHtml(this._failed.get(tab.id)));
    else this._armRegisterTimer(tab.id);
  }

  _removeTab(nav, tabId) {
    const wasActive = this._tabNav.remove(nav, tabId);
    this._clearRegisterTimer(tabId);
    const def = this._defs.get(tabId);
    if (def) def.mounted = false;
    this._urlByTab.delete(tabId);
    this._pendingShow.delete(tabId);
    if (wasActive && this._navigator) { try { this._navigator.go('settings'); } catch (_) {} }
  }

  _servedFromFile() {
    const loc = this._win && this._win.location;
    return !!loc && loc.protocol === 'file:';
  }

  _bundleFailed(tabId, message) {
    this._clearRegisterTimer(tabId);
    this._failed.set(tabId, message);
    if (!this._defs.has(tabId)) this._setPane(tabId, ExtensionTabNav.failedHtml(message));
  }

  _armRegisterTimer(tabId) {
    this._clearRegisterTimer(tabId);
    const timer = setTimeout(() => {
      this._registerTimers.delete(tabId);
      if (!this._defs.has(tabId)) this._bundleFailed(tabId, SetupExtensionTabs.BUNDLE_SILENT);
    }, SetupExtensionTabs.REGISTER_TIMEOUT_MS);
    this._registerTimers.set(tabId, timer);
  }

  _clearRegisterTimer(tabId) {
    const timer = this._registerTimers.get(tabId);
    if (timer === undefined) return;
    clearTimeout(timer);
    this._registerTimers.delete(tabId);
  }

  _setPane(tabId, html) {
    const pane = this._tabNav.pane(tabId);
    if (pane) pane.innerHTML = html;
  }

  _mount(tabId) {
    const def = this._defs.get(tabId);
    const pane = this._tabNav.pane(tabId);
    if (!def || !pane || def.mounted || typeof def.mount !== 'function') return;
    def.mounted = true;
    try {
      pane.innerHTML = '';
      def.mount(pane, this._mountApi(tabId));
    } catch (e) {
      pane.innerHTML = ExtensionTabNav.failedHtml(e && e.message);
    }
  }

  _mountApi(tabId) {
    return {
      llmDiagAPI: this._api,
      invoke: (action, payload) => this._api.setup.invoke(this.extensionIdFor(tabId), action, payload),
    };
  }

  extensionIdFor(tabId) {
    const match = SetupExtensionTabs.URL_EXT_ID.exec(this._urlByTab.get(tabId) || '');
    return match ? match[1] : tabId;
  }

  _bindLiveHooks() {
    this._win.addEventListener('luma-mode-changed', (e) => { if (e && e.detail === 'setup') this._maybeSync(); });
    this._win.addEventListener('focus', () => this._maybeSync());
    this._doc.addEventListener('visibilitychange', () => { if (!this._doc.hidden) this._maybeSync(); });
  }

  _maybeSync() {
    if (Date.now() - this._lastSyncAt < SetupExtensionTabs.RESYNC_MIN_MS) return;
    this.sync();
  }
}
