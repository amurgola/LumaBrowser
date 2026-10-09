const path = require('path');
const { BrowserWindow } = require('electron');
const OnDemandGeometry = require('./OnDemandGeometry');
const OnDemandPlacement = require('./OnDemandPlacement');

class OnDemandWindowFactory {
  static PRELOAD_PATH = path.join(__dirname, 'on-demand-preload.js');
  static HTML_PATH = path.join(__dirname, 'ui', 'on-demand.html');

  static create(parent, handlers) {
    const win = new BrowserWindow(OnDemandWindowFactory.options(parent));
    OnDemandWindowFactory._hideMenu(win);
    OnDemandWindowFactory._wire(win, handlers);
    win.loadFile(OnDemandWindowFactory.HTML_PATH);
    OnDemandWindowFactory._maybeOpenDevTools(win);
    return win;
  }

  static options(parent) {
    const side = OnDemandGeometry.ICON_SIZE + OnDemandPlacement.PAD * 2;
    return {
      parent,
      show: false,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      hasShadow: false,
      thickFrame: false,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      focusable: true,
      roundedCorners: false,
      title: 'Luma On Demand',
      width: side,
      height: side,
      webPreferences: {
        preload: OnDemandWindowFactory.PRELOAD_PATH,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        backgroundThrottling: false,
      },
    };
  }

  static _hideMenu(win) {
    try {
      win.setMenuBarVisibility(false);
    } catch (_) {}
  }

  static _wire(win, { onLoaded, onInput, onClosed }) {
    const wc = win.webContents;
    wc.once('did-finish-load', () => onLoaded());
    wc.on('before-input-event', (event, input) => onInput(event, input));
    wc.setWindowOpenHandler(() => ({ action: 'deny' }));
    win.on('closed', () => onClosed());
  }

  static _maybeOpenDevTools(win) {
    if (!process.env.LUMA_ON_DEMAND_DEVTOOLS) return;
    try {
      win.webContents.openDevTools({ mode: 'detach' });
    } catch (_) {}
  }
}

module.exports = OnDemandWindowFactory;
