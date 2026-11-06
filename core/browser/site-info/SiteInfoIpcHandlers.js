const { ipcMain } = require('electron');

class SiteInfoIpcHandlers {
  constructor({ siteInfo, getTabViewManager, ipc = ipcMain }) {
    this._info = siteInfo;
    this._tvm = getTabViewManager || (() => null);
    this._ipc = ipc;
  }

  register() {
    const i = this._info;
    this._handle('core.siteInfo.get', (tabId) => i.get(tabId));
    this._handle('core.siteInfo.setPermission', (tabId, kind, value) => i.setPermission(tabId, kind, value));
    this._handle('core.siteInfo.setAdblock', (tabId, off) => i.setAdblock(tabId, off));
    this._handle('core.siteInfo.clearData', (tabId) => i.clearData(tabId));
  }

  _handle(channel, fn) {
    this._ipc.handle(channel, async (event, ...args) => {
      const tvm = this._tvm();
      if (tvm && typeof tvm.isChromeSender === 'function' && !tvm.isChromeSender(event && event.sender)) return { success: false, error: 'Not allowed' };
      try { return await fn(...args); } catch (err) { return { success: false, error: err.message }; }
    });
  }
}

module.exports = SiteInfoIpcHandlers;
