const path = require('path');

class CapturerWindow {
  static CHANNEL = 'ext.tab-share.rtc';
  static PARTITION = 'tabshare-capturer';
  static READY_TIMEOUT_MS = 20000;

  constructor({ electron, extensionDir, takePendingFrame, onMessage, onClosed, onRendererGone, log } = {}) {
    this._electron = electron;
    this._extensionDir = extensionDir;
    this._takePendingFrame = takePendingFrame || (() => null);
    this._onMessage = onMessage || (() => {});
    this._onClosed = onClosed || (() => {});
    this._onRendererGone = onRendererGone || (() => {});
    this._log = log || (() => {});
    this._win = null;
    this._onIpc = null;
    this._resolveReady = null;
  }

  open() {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('capturer page never became ready')), CapturerWindow.READY_TIMEOUT_MS);
      this._resolveReady = () => { clearTimeout(timer); resolve(); };
      try {
        this._installDisplayMediaHandler();
        this._createWindow();
        this._win.loadFile(path.join(this._extensionDir, 'rtc', 'capturer.html')).catch((err) => { clearTimeout(timer); reject(err); });
      } catch (err) {
        clearTimeout(timer);
        reject(err);
      }
    });
  }

  markReady() {
    if (!this._resolveReady) return;
    this._resolveReady();
    this._resolveReady = null;
  }

  isOpen() {
    return !!this._win;
  }

  send(msg) {
    if (!this._win) return;
    try { this._win.webContents.send(CapturerWindow.CHANNEL, msg); } catch (_) {}
  }

  destroy() {
    const { ipcMain } = this._electron || {};
    if (ipcMain && this._onIpc) { try { ipcMain.removeListener(CapturerWindow.CHANNEL, this._onIpc); } catch (_) {} }
    if (this._win) { try { this._win.destroy(); } catch (_) {} this._win = null; }
  }

  _installDisplayMediaHandler() {
    const sess = this._electron.session.fromPartition(CapturerWindow.PARTITION);
    sess.setDisplayMediaRequestHandler((request, callback) => {
      const frame = this._takePendingFrame();
      if (!frame) {
        this._log('display-media request with nothing pending; denied');
        try { callback({}); } catch (_) {}
        return;
      }
      callback({ video: frame });
    }, { useSystemPicker: false });
  }

  _createWindow() {
    const { BrowserWindow, ipcMain } = this._electron;
    this._win = new BrowserWindow({
      show: false, width: 640, height: 480,
      webPreferences: {
        partition: CapturerWindow.PARTITION,
        preload: path.join(this._extensionDir, 'rtc', 'capturer-preload.js'),
        contextIsolation: true, nodeIntegration: false, sandbox: false,
        backgroundThrottling: false,
      },
    });
    this._onIpc = (event, msg) => {
      if (!this._win || event.sender !== this._win.webContents) return;
      this._onMessage(msg || {});
    };
    ipcMain.on(CapturerWindow.CHANNEL, this._onIpc);
    this._win.on('closed', () => { this._win = null; this._onClosed(); });
    this._win.webContents.on('render-process-gone', (_e, details) => this._onRendererGone(details && details.reason));
  }
}

module.exports = CapturerWindow;
