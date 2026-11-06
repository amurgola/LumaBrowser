const { ipcMain } = require('electron');

class BrowsingDataClearIpc {
  constructor({ clearer, getTabViewManager, ipc = ipcMain }) {
    this._clearer = clearer;
    this._tvm = getTabViewManager || (() => null);
    this._ipc = ipc;
  }

  register() {
    this._ipc.handle('core.browsingData.clear', async (event, what) => {
      const tvm = this._tvm();
      if (tvm && typeof tvm.isChromeSender === 'function' && !tvm.isChromeSender(event && event.sender)) return { success: false, error: 'Not allowed' };
      try { return await this._clearer.clear(what || {}); } catch (err) { return { success: false, error: err.message }; }
    });
  }
}

module.exports = BrowsingDataClearIpc;
