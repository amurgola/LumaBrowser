class TabPopupHandler {

  constructor({ registry, createTab, gate = null }) {
    this._registry = registry;
    this._createTab = createTab;
    this._gate = gate;
  }

  wire(entry) {
    if (this._gate) this._gate.wire(entry);
    entry.webContents.setWindowOpenHandler((details) => this._decide(entry, details));
  }

  openBlocked(tabId, index) {
    const entry = this._registry.get(tabId);
    if (!entry || !this._gate) return { success: false };
    const url = this._gate.take(entry, index);
    if (url) this._openAsTab(entry, url, 'foreground-tab');
    return { success: !!url };
  }

  allowSite(tabId) {
    const entry = this._registry.get(tabId);
    if (!entry || !this._gate) return { success: false };
    const res = this._gate.allowSite(entry);
    for (const url of res.urls) this._openAsTab(entry, url, 'background-tab');
    return { success: res.success, opened: res.urls.length };
  }

  _decide(entry, { url, disposition }) {
    if (this._gate && !this._gate.allows(entry)) {
      this._gate.block(entry, url);
      return { action: 'deny' };
    }
    if (TabPopupHandler._needsRealWindow(url, disposition)) {
      return { action: 'allow', overrideBrowserWindowOptions: TabPopupHandler._popupWindowOptions(entry) };
    }
    this._openAsTab(entry, url, disposition);
    return { action: 'deny' };
  }

  static _popupWindowOptions(entry) {
    const wc = entry.webContents;
    const opener = wc && typeof wc.getLastWebPreferences === 'function' ? wc.getLastWebPreferences() : null;
    return { autoHideMenuBar: true, webPreferences: { sandbox: !opener || opener.sandbox !== false } };
  }

  static _needsRealWindow(url, disposition) {
    return disposition === 'new-window' || !url || url === 'about:blank';
  }

  _openAsTab(entry, url, disposition) {
    this._createTab(url, {
      activate: disposition !== 'background-tab' && !entry.silent,
      silent: !!entry.silent,
      partition: entry.partition,
      index: this._registry.indexOf(entry.id) + 1,
      openerTabId: entry.id,
    });
  }
}

module.exports = TabPopupHandler;
