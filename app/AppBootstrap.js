const AppContext = require('./AppContext');
const BootClock = require('./BootClock');
const ProcessSetup = require('./process/ProcessSetup');
const AppServices = require('./services/AppServices');
const AllRenderers = require('./events/AllRenderers');
const DesktopNotice = require('./events/DesktopNotice');
const CoreIpcRegistrar = require('./ipc/CoreIpcRegistrar');
const DebugIpc = require('./debug/DebugIpc');
const MainWindow = require('./window/MainWindow');
const WindowServices = require('./browser/WindowServices');
const DeferredServices = require('./ready/DeferredServices');
const UpdateCheck = require('./ready/UpdateCheck');
const ReadyPhase = require('./ready/ReadyPhase');
const SettledStarts = require('./ready/SettledStarts');
const AppLifecycle = require('./shutdown/AppLifecycle');

class AppBootstrap {
  constructor({ electron = require('electron'), rootDir, env = process.env, argv = process.argv, proc = process, log = console, processSetup = {} }) {
    this._electron = electron;
    this._options = { rootDir, env, argv, proc };
    this._log = log;
    this._processSetup = processSetup;
    this.ctx = null;
  }

  start() {
    this._createContext();
    if (!this._prepareProcess()) return false;
    this._buildServices();
    this._buildWindowControllers();
    this._registerIpc();
    new AppLifecycle(this.ctx, { log: this._log }).wire();
    this._scheduleReady();
    return true;
  }

  _createContext() {
    this.ctx = new AppContext({ electron: this._electron, ...this._options });
    this.ctx.boot = new BootClock({ log: (line) => this._log.log(line) });
    this.ctx.boot.log('main.js loaded');
  }

  _prepareProcess() {
    return new ProcessSetup(this.ctx, { ...this._processSetup, log: this._log }).run();
  }

  _buildServices() {
    this.ctx.renderers = new AllRenderers(this._electron.webContents);
    this.ctx.desktopNotice = new DesktopNotice({ Notification: this._electron.Notification, iconPath: this.ctx.iconPath() });
    new AppServices(this.ctx, { log: this._log }).build();
  }

  _buildWindowControllers() {
    const windowServices = new WindowServices(this.ctx, { log: this._log });
    this.ctx.mainWindowController = new MainWindow(this.ctx, { windowServices, log: this._log });
    this.ctx.deferredServices = new DeferredServices(this.ctx, { log: this._log });
    this._updateCheck = new UpdateCheck({
      getWindow: () => this.ctx.liveWindow(),
      db: this.ctx.services.db,
      env: this.ctx.env,
      isDev: this.ctx.isDev,
    });
  }

  _registerIpc() {
    this.ctx.routers = new CoreIpcRegistrar(this.ctx, {
      ipcMain: this._electron.ipcMain,
      updateCheck: this._updateCheck,
      debugIpc: new DebugIpc(this.ctx, { log: this._log }),
    }).register();
  }

  _scheduleReady() {
    const ready = this._electron.app.whenReady();
    ready.then(() => new ReadyPhase(this.ctx, { updateCheck: this._updateCheck, log: this._log }).run())
      .catch((err) => this._log.error('[main] ready phase failed:', err));
    ready.then(() => new SettledStarts(this.ctx, { log: this._log }).run())
      .catch((err) => this._log.error('[main] settled starts failed:', err));
  }
}

module.exports = AppBootstrap;
