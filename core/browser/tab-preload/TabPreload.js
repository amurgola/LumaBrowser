const MainWorldScript = require('./MainWorldScript');
const NotificationForwarder = require('./NotificationForwarder');

class TabPreload {
  constructor(electron, win, shims) {
    this._ipcRenderer = electron.ipcRenderer;
    this._webFrame = electron.webFrame;
    this._window = win;
    this._shims = shims || {};
  }

  install() {
    this._injectMainWorld();
    new NotificationForwarder(this._ipcRenderer, this._window).listen();
  }

  _injectMainWorld() {
    const script = MainWorldScript.build(this._shims.chrome || '', this._shims.passkey || '');
    this._webFrame.executeJavaScript(script).catch((err) => {
      console.error('webview-preload: main-world injection failed:', err && err.message);
    });
  }

  static optionalSource(load) {
    try { return load().SOURCE || ''; } catch (_) { return ''; }
  }
}

module.exports = TabPreload;
