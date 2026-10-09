class TabPopupHandler {
  static POPUP_WINDOW_OPTIONS = { autoHideMenuBar: true };

  constructor({ registry, createTab }) {
    this._registry = registry;
    this._createTab = createTab;
  }

  wire(entry) {
    entry.webContents.setWindowOpenHandler((details) => this._decide(entry, details));
  }

  _decide(entry, { url, disposition }) {
    if (TabPopupHandler._needsRealWindow(url, disposition)) {
      return { action: 'allow', overrideBrowserWindowOptions: TabPopupHandler.POPUP_WINDOW_OPTIONS };
    }
    this._openAsTab(entry, url, disposition);
    return { action: 'deny' };
  }

  static _needsRealWindow(url, disposition) {
    return disposition === 'new-window' || !url || url === 'about:blank';
  }

  _openAsTab(entry, url, disposition) {
    this._createTab(url, {
      activate: disposition !== 'background-tab',
      partition: entry.partition,
      index: this._registry.indexOf(entry.id) + 1,
      openerTabId: entry.id,
    });
  }
}

module.exports = TabPopupHandler;
