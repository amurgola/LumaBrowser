const path = require('path');

class SandboxWindow {
  static PARTITION = 'tool-forge-sandbox';
  static RECYCLE_AFTER = 50;
  static PRELOAD_FILE = 'runner-preload.js';
  static PAGE_FILE = 'runner.html';

  constructor({ electron, onCrash, dir = __dirname }) {
    this._electron = electron;
    this._onCrash = onCrash;
    this._dir = dir;
    this._win = null;
    this._sessionHardened = false;
    this._execCount = 0;
  }

  async prepare() {
    this._recycleIfDue();
    return this._ensure();
  }

  nextCallId() {
    this._execCount += 1;
    return `c${Date.now().toString(36)}_${Math.floor(this._execCount)}`;
  }

  isSender(event) {
    return !!(this._win && !this._win.isDestroyed() && event && event.sender && event.sender.id === this._win.webContents.id);
  }

  destroy() {
    try { if (this._win && !this._win.isDestroyed()) this._win.destroy(); } catch (_) {}
    this._win = null;
  }

  _recycleIfDue() {
    if (this._execCount < SandboxWindow.RECYCLE_AFTER || !this._win || this._win.isDestroyed()) return;
    this.destroy();
    this._execCount = 0;
  }

  async _ensure() {
    if (this._win && !this._win.isDestroyed()) return this._win;
    this._hardenSession();
    const win = new this._electron.BrowserWindow(SandboxWindow.windowOptions(path.join(this._dir, SandboxWindow.PRELOAD_FILE)));
    this._lockDown(win);
    await win.loadFile(path.join(this._dir, SandboxWindow.PAGE_FILE));
    this._win = win;
    return win;
  }

  _hardenSession() {
    if (this._sessionHardened) return;
    const session = this._electron.session.fromPartition(SandboxWindow.PARTITION);
    session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
    session.setPermissionCheckHandler(() => false);
    session.webRequest.onBeforeRequest((details, callback) => callback({ cancel: !SandboxWindow.isOwnPageUrl(details.url) }));
    this._sessionHardened = true;
  }

  _lockDown(win) {
    win.webContents.on('render-process-gone', (_event, details) => this._crashed(win, details));
    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  }

  _crashed(win, details) {
    this._onCrash(`Sandbox crashed (${details && details.reason}).`);
    try { if (!win.isDestroyed()) win.destroy(); } catch (_) {}
    if (this._win === win) this._win = null;
  }

  static isOwnPageUrl(url) {
    return url.startsWith('file:') || url === 'about:blank';
  }

  static windowOptions(preload) {
    return {
      show: false,
      width: 400,
      height: 300,
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        nodeIntegrationInWorker: false,
        webSecurity: true,
        partition: SandboxWindow.PARTITION,
        preload,
        backgroundThrottling: false,
      },
    };
  }
}

module.exports = SandboxWindow;
