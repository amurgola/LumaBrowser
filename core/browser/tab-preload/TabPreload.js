const MainWorldScript = require('./MainWorldScript');
const NotificationForwarder = require('./NotificationForwarder');
const LoginFormWatcher = require('./LoginFormWatcher');
const AddressFormWatcher = require('./AddressFormWatcher');
const NewTabBridge = require('./NewTabBridge');
const FullscreenEscape = require('./FullscreenEscape');
const FieldMenuKeys = require('./FieldMenuKeys');

class TabPreload {
  constructor(electron, win, shims) {
    this._ipcRenderer = electron.ipcRenderer;
    this._webFrame = electron.webFrame;
    this._contextBridge = electron.contextBridge || null;
    this._window = win;
    this._shims = shims || {};
  }

  install() {
    this._injectMainWorld();
    new NotificationForwarder(this._ipcRenderer, this._window).listen();
    new LoginFormWatcher(this._ipcRenderer, this._window).install();
    new AddressFormWatcher(this._ipcRenderer, this._window).install();
    NewTabBridge.install(this._contextBridge, this._ipcRenderer, this._window);
    FullscreenEscape.install(this._window);
    new FieldMenuKeys(this._ipcRenderer, this._window).install();
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
