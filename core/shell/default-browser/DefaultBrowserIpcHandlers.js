const { ipcMain, app, shell } = require('electron');
const { execFile } = require('child_process');
const DefaultBrowser = require('./DefaultBrowser');

class DefaultBrowserIpcHandlers {
  static run(file, args) {
    return new Promise((resolve, reject) => {
      execFile(file, args, { windowsHide: true, timeout: 15000 }, (err, stdout) => (err ? reject(err) : resolve({ stdout })));
    });
  }

  constructor({ getTabViewManager, browser = null, ipc = ipcMain }) {
    this._tvm = getTabViewManager || (() => null);
    this._ipc = ipc;
    this._browser = browser || new DefaultBrowser({
      app, shell, run: DefaultBrowserIpcHandlers.run, appPath: app.getAppPath(), isPackaged: app.isPackaged,
    });
  }

  register() {
    this._handle('core.defaultBrowser.status', () => this._browser.status());
    this._handle('core.defaultBrowser.makeDefault', () => this._browser.makeDefault());
  }

  _handle(channel, fn) {
    this._ipc.handle(channel, async (event) => {
      const tvm = this._tvm();
      if (tvm && typeof tvm.isChromeSender === 'function' && !tvm.isChromeSender(event && event.sender)) return { success: false, error: 'Not allowed' };
      return fn();
    });
  }
}

module.exports = DefaultBrowserIpcHandlers;
