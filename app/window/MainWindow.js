const RendererRecovery = require('../../core/shell/RendererRecovery');
const MainWindowOptions = require('./MainWindowOptions');
const WindowKeys = require('./WindowKeys');
const StartupTabs = require('./StartupTabs');
const AppTray = require('./AppTray');

class MainWindow {
  static SHELL_FILE = 'index.html';
  static BOOT_LOG_PREFIX = '[luma-boot';

  constructor(ctx, { windowServices, log = console }) {
    this._ctx = ctx;
    this._windowServices = windowServices;
    this._log = log;
    this._osShutdownHooked = false;
    this._tray = null;
    this._created = false;
  }

  create() {
    this._created = true;
    const win = this._buildWindow();
    this._attachRecovery(win);
    this._hookOsShutdown(win);
    this._load(win);
    this._wireDiagnostics(win);
    WindowKeys.attach(win);
    this._ctx.services.db.delete('openDevTools');
    this._createTray();
    this._wireFirstLoad(win);
    this._wireClosed(win);
    this._wireWindowState(win);
    this._wireMinimizeToTray(win);
    this._windowServices.wire(win);
    return win;
  }

  show() {
    const win = this._ctx.liveWindow();
    if (!win) return false;
    const recovery = this._ctx.rendererRecovery;
    if (recovery && recovery.suspended) recovery.renew();
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
    return true;
  }

  wasClosed() {
    return this._created && !this._ctx.mainWindow;
  }

  refreshTray() {
    return this._tray ? this._tray.refresh() : false;
  }

  _buildWindow() {
    const { BrowserWindow } = this._ctx.electron;
    const preloadPath = this._ctx.path('preload.js');
    this._log.log('Preload path:', preloadPath);
    const options = MainWindowOptions.build({ platform: this._ctx.proc.platform, startHidden: this._ctx.startHidden, iconPath: this._ctx.iconPath(), preloadPath });
    const win = new BrowserWindow(options);
    this._ctx.mainWindow = win;
    this._ctx.boot.log('BrowserWindow created');
    return win;
  }

  _attachRecovery(win) {
    const recovery = new RendererRecovery({ log: this._log });
    this._ctx.rendererRecovery = recovery;
    recovery.attach(win, {
      reload: () => { const live = this._ctx.liveWindow(); if (live) live.loadFile(MainWindow.SHELL_FILE); },
      isExiting: () => Boolean(this._ctx.quitController && this._ctx.quitController.isQuitting),
      onSuspended: () => this.refreshTray(),
      onRenewed: () => this.refreshTray(),
    });
  }

  _hookOsShutdown(win) {
    const markShutdown = () => { if (this._ctx.quitController) this._ctx.quitController.markSystemShutdown(); };
    if (this._ctx.proc.platform === 'win32') {
      win.on('session-end', markShutdown);
      return;
    }
    if (this._osShutdownHooked) return;
    this._osShutdownHooked = true;
    try {
      this._ctx.electron.powerMonitor.on('shutdown', () => { markShutdown(); this._ctx.app.quit(); });
    } catch (_) {}
  }

  _load(win) {
    win.loadFile(MainWindow.SHELL_FILE);
    this._ctx.boot.log('loadFile(index.html) called');
  }

  _wireDiagnostics(win) {
    win.webContents.once('dom-ready', () => this._ctx.boot.log('renderer dom-ready'));
    win.webContents.once('did-finish-load', () => this._ctx.boot.log('renderer did-finish-load'));
    win.webContents.on('console-message', (details) => {
      const message = details && details.message;
      if (typeof message === 'string' && message.startsWith(MainWindow.BOOT_LOG_PREFIX)) this._log.log(message);
    });
  }

  _createTray() {
    const { Tray, Menu, nativeImage } = this._ctx.electron;
    this._tray = new AppTray({
      Tray, Menu, nativeImage,
      iconPath: this._ctx.path('assets', 'tray-icon.png'),
      isSuspended: () => Boolean(this._ctx.rendererRecovery && this._ctx.rendererRecovery.suspended),
      onShow: () => this.show(),
      onQuit: () => this._ctx.app.quit(),
    });
    this._ctx.tray = this._tray.create();
  }

  _wireFirstLoad(win) {
    const s = this._ctx.services;
    const startupTabs = new StartupTabs({
      getTabViewManager: () => this._ctx.tabViewManager,
      llmServerService: s.llmServerService,
      db: s.db,
      bookmarkService: s.bookmarkService,
      log: this._log,
    });
    win.webContents.on('did-finish-load', () => {
      win.webContents.setZoomFactor(1.0);
      win.webContents.send('settings-loaded', { webhookUrl: s.db.get('webhookUrl', '') });
      startupTabs.open();
    });
  }

  _wireClosed(win) {
    win.on('closed', () => {
      if (this._ctx.tabViewManager) this._ctx.tabViewManager.destroyAll();
      this._ctx.mainWindow = null;
      this._ctx.services.restGateway.stop();
    });
  }

  _wireWindowState(win) {
    const send = () => {
      const live = this._ctx.liveWindow();
      if (live) live.webContents.send('window:state', { maximized: live.isMaximized() || live.isFullScreen() });
    };
    for (const event of ['maximize', 'unmaximize', 'enter-full-screen', 'leave-full-screen']) win.on(event, send);
    win.webContents.on('did-finish-load', send);
  }

  _wireMinimizeToTray(win) {
    win.on('minimize', (event) => {
      event.preventDefault();
      win.hide();
    });
  }
}

module.exports = MainWindow;
