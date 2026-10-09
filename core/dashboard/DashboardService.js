const path = require('path');
const { pathToFileURL } = require('url');
const InternalTabLoader = require('../shell/InternalTabLoader');
const DashboardLayout = require('./DashboardLayout');

class DashboardService {
  static TAB_KIND = 'dashboard';
  static TAB_TITLE = 'Dashboard';
  static GATEWAY_PATH = '/dashboard-ui/dashboard.html';

  constructor({ settingsDb, rootDir } = {}) {
    if (!settingsDb) throw new Error('DashboardService requires a settingsDb');
    this._layout = new DashboardLayout(settingsDb);
    this._setupTabPaths(rootDir || __dirname);
    this.tabViewManager = null;
    this._tabId = null;
    this.tabLoadedOk = false;
  }

  attachTabViewManager(tabViewManager) {
    this.tabViewManager = tabViewManager;
  }

  setWebBaseUrl(baseUrl) {
    if (!baseUrl) return;
    this.tabHtmlUrl = `${String(baseUrl).replace(/\/+$/, '')}${DashboardService.GATEWAY_PATH}`;
  }

  getTabId() {
    return this._isTabOpen() ? this._tabId : null;
  }

  ensureTab({ activate = true } = {}) {
    if (!this.tabViewManager) return null;
    if (this._isTabOpen()) return this._reactivate(activate);
    const tabId = this._createTab(activate);
    this._wireLoader(tabId);
    return tabId;
  }

  notifyGatewayReady() {
    const tabId = this.getTabId();
    if (tabId === null) return;
    InternalTabLoader.reloadIfStale(this, this._webContentsOf(tabId));
  }

  getLayout() {
    return this._layout.get();
  }

  setLayout(items) {
    return this._layout.set(items);
  }

  pinWidget(rootId) {
    return this._layout.pin(rootId);
  }

  getHiddenWidgets() {
    return this._layout.hiddenWidgets();
  }

  setWidgetHidden(rootId, hidden) {
    return this._layout.setHidden(rootId, hidden);
  }

  _setupTabPaths(rootDir) {
    this.tabHtmlPath = path.join(rootDir, 'ui', 'dashboard.html');
    this.tabHtmlFileUrl = pathToFileURL(this.tabHtmlPath).href;
    this.tabHtmlUrl = this.tabHtmlFileUrl;
    this.tabPreloadPath = path.join(rootDir, 'dashboard-tab-preload.js');
  }

  _isTabOpen() {
    return this._tabId !== null && !!this.tabViewManager && !!this.tabViewManager.getEntry(this._tabId);
  }

  _reactivate(activate) {
    if (activate) {
      try { this.tabViewManager.switchToTab(this._tabId); } catch (_) {}
    }
    return this._tabId;
  }

  _createTab(activate) {
    const tab = this.tabViewManager.createTab(this.tabHtmlUrl, {
      kind: DashboardService.TAB_KIND,
      title: DashboardService.TAB_TITLE,
      activate,
      preloadPath: this.tabPreloadPath,
    });
    this._tabId = tab.id;
    return tab.id;
  }

  _wireLoader(tabId) {
    const wc = this._webContentsOf(tabId);
    if (wc && !wc.isDestroyed()) InternalTabLoader.wire(this, wc);
  }

  _webContentsOf(tabId) {
    return this.tabViewManager.getWebContents ? this.tabViewManager.getWebContents(tabId) : null;
  }
}

module.exports = DashboardService;
