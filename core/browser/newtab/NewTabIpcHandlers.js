const { ipcMain } = require('electron');
const NewTabPage = require('./NewTabPage');

class NewTabIpcHandlers {
  constructor({ page, getTabViewManager, ipc = ipcMain }) {
    this._page = page;
    this._tvm = getTabViewManager || (() => null);
    this._ipc = ipc;
  }

  register() {
    const p = this._page;
    this._fromPage('core.newtab.data', () => p.data());
    this._fromPage('core.newtab.search', (q) => p.searchUrl(q));
    this._fromPage('core.newtab.hide', (url) => p.hide(url));
    this._fromChrome('core.newtab.url', () => p.url());
    this._fromChrome('core.newtab.getMode', () => p.mode());
    this._fromChrome('core.newtab.setMode', (mode) => p.setMode(mode));
    this._fromChrome('core.newtab.resetHidden', () => p.resetHidden());
  }

  static isPage(sender) {
    try { return !!sender && NewTabPage.isNewTab(sender.getURL()); } catch (_) { return false; }
  }

  _fromPage(channel, fn) {
    this._ipc.handle(channel, (event, ...args) => (NewTabIpcHandlers.isPage(event && event.sender) ? fn(...args) : null));
  }

  _fromChrome(channel, fn) {
    this._ipc.handle(channel, (event, ...args) => {
      const tvm = this._tvm();
      if (tvm && typeof tvm.isChromeSender === 'function' && !tvm.isChromeSender(event && event.sender)) return null;
      return fn(...args);
    });
  }
}

module.exports = NewTabIpcHandlers;
