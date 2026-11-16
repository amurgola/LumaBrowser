const { ipcMain } = require('electron');
const DownloadsPage = require('./DownloadsPage');

class DownloadsIpcHandlers {
  constructor({ viewers, getTabViewManager, ipc = ipcMain }) {
    this._viewers = viewers;
    this._tvm = getTabViewManager || (() => null);
    this._ipc = ipc;
  }

  register() {
    this._fromPage('core.downloads.list', (event) => this._viewers.watch(event.sender));
    this._onDownloads('core.downloads.open', (downloads, id) => downloads.open(id));
    this._onDownloads('core.downloads.show', (downloads, id) => downloads.showInFolder(id));
    this._onDownloads('core.downloads.copyLink', (downloads, id) => downloads.copyLink(id));
    this._onDownloads('core.downloads.cancel', (downloads, id) => downloads.cancel(id));
    this._onDownloads('core.downloads.remove', (downloads, id) => downloads.remove(id));
    this._onDownloads('core.downloads.clear', (downloads) => downloads.clearFinished());
    this._fromChrome('core.downloads.openPage', (event) => this._viewers.openTab(this._tvm().windowIdForSender(event.sender)));
  }

  static isPage(sender) {
    try { return !!sender && DownloadsPage.isDownloads(sender.getURL()); } catch (_) { return false; }
  }

  _fromPage(channel, fn) {
    this._ipc.handle(channel, (event, ...args) => (DownloadsIpcHandlers.isPage(event && event.sender) ? fn(event, ...args) : null));
  }

  _onDownloads(channel, fn) {
    this._fromPage(channel, (_event, ...args) => {
      const downloads = this._viewers.downloads();
      return downloads ? fn(downloads, ...args) : null;
    });
  }

  _fromChrome(channel, fn) {
    this._ipc.handle(channel, (event, ...args) => {
      const tvm = this._tvm();
      if (!tvm || typeof tvm.isChromeSender !== 'function' || !tvm.isChromeSender(event && event.sender)) return null;
      return fn(event, ...args);
    });
  }
}

module.exports = DownloadsIpcHandlers;
