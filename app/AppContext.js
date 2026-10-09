const path = require('path');

class AppContext {
  constructor({ electron, rootDir, env = process.env, argv = process.argv, proc = process }) {
    this.electron = electron;
    this.rootDir = rootDir;
    this.env = env;
    this.argv = argv;
    this.proc = proc;
    this.isDev = argv.includes('--dev') || !electron.app.isPackaged;
    this.startHidden = argv.includes('--hidden');
    this.isolatedDataDir = Boolean(env.LUMA_DATA_DIR);
    this.boot = null;
    this.dataDir = null;
    this.apiPort = 3000;
    this.apiEnabled = true;
    this.services = {};
    this._resetWindowState();
  }

  get app() {
    return this.electron.app;
  }

  liveWindow() {
    const win = this.mainWindow;
    return win && !win.isDestroyed() ? win : null;
  }

  gatewayOrigin() {
    return `http://127.0.0.1:${this.apiPort}`;
  }

  webBase() {
    return this.apiEnabled ? this.gatewayOrigin() : null;
  }

  path(...parts) {
    return path.join(this.rootDir, ...parts);
  }

  iconPath() {
    return this.path('icon', 'icon.png');
  }

  notifyModelStatus(message, type) {
    const win = this.liveWindow();
    if (win) win.webContents.send('model-status', { message, type });
  }

  _resetWindowState() {
    this.mainWindow = null;
    this.mainWindowController = null;
    this.tray = null;
    this.rendererRecovery = null;
    this.quitController = null;
    this.tabViewManager = null;
    this.tabManager = null;
    this.chromeOverlay = null;
    this.tabPreviewManager = null;
    this.onDemandOverlay = null;
    this.browserService = null;
    this.heavyServices = null;
    this.deferredServices = null;
    this.identityReady = Promise.resolve();
    this.agentDeps = null;
  }
}

module.exports = AppContext;
