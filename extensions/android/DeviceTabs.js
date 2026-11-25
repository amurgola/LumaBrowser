class DeviceTabs {
  static PAGE_PATH = '/api/ext/android/';
  static API_OFF = 'The device page is served by the local API, which is switched off (Settings > API & MCP).';

  constructor({ browser, gatewayInfo }) {
    this._browser = browser;
    this._gatewayInfo = gatewayInfo;
  }

  urlOf(deviceName) {
    if (!this._gatewayInfo.baseUrl) throw new Error(DeviceTabs.API_OFF);
    const base = String(this._gatewayInfo.baseUrl).replace('//localhost', '//127.0.0.1').replace(/\/+$/, '');
    return `${base}${DeviceTabs.PAGE_PATH}?device=${encodeURIComponent(deviceName)}`;
  }

  async open(deviceName, { keep = false } = {}) {
    const url = this.urlOf(deviceName);
    const tabs = this._tabs();
    const existing = tabs ? tabs.getAllTabs().find((tab) => tab.url === url) : null;
    const tabId = existing ? this._show(tabs, existing.id) : await this._create(url, deviceName);
    if (keep && tabs && tabId != null) tabs.setTabPersistence(tabId, true);
    return { tabId, url };
  }

  _show(tabs, tabId) {
    if (typeof tabs.showTab === 'function') tabs.showTab(tabId); else tabs.switchToTab(tabId);
    return tabId;
  }

  async _create(url, deviceName) {
    const created = await this._browser.createTab(url, { activate: true, title: deviceName.replace(/_/g, ' ') });
    const tab = created && (created.tab || created);
    return tab && tab.id != null ? tab.id : null;
  }

  _tabs() {
    const manager = typeof this._browser.getTabManager === 'function' ? this._browser.getTabManager() : null;
    return (manager && manager.tabViewManager) || null;
  }
}

module.exports = DeviceTabs;
