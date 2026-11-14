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
    this._handle('core.siteInfo.setPermission', (tabId, kind, value, origin) => i.setPermission(tabId, kind, value, origin));
    this._handle('core.siteInfo.setAdblock', (tabId, off, origin) => i.setAdblock(tabId, off, origin));
    this._handle('core.siteInfo.clearData', (tabId, origin) => i.clearData(tabId, origin));
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
