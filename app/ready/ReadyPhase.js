const ContextMenu = require('../../core/shell/ContextMenu');
const SessionSetup = require('./SessionSetup');
const AppMenu = require('./AppMenu');
const BackgroundStarts = require('./BackgroundStarts');

class ReadyPhase {
  constructor(ctx, { updateCheck, log = console }) {
    this._ctx = ctx;
    this._s = ctx.services;
    this._updateCheck = updateCheck;
    this._log = log;
  }

  async run() {
    this._ctx.boot.log('app.whenReady fired');
    this._resolveIdentity();
    const sessions = new SessionSetup(this._ctx, { log: this._log });
    sessions.applyPolicies();
    await this._initChromeExtensions();
    const setupComplete = Boolean(this._s.db.get('core.setupComplete', null));
    this._ctx.boot.log(`setup gate: core.setupComplete=${setupComplete}`);
    sessions.hookSessions();
    this._installMenus();
    this._createWindow();
    this._startDeferred(setupComplete);
    this._scheduleBackgroundStarts();
  }

  _resolveIdentity() {
    this._ctx.identityReady = (async () => {
      await this._s.machineIdentity.resolve();
      this._ctx.boot.log('machineIdentity.resolve done');
      this._s.pulseService.start();
      this._ctx.boot.log('pulseService started');
    })();
    this._ctx.identityReady.catch((err) => this._log.error('Machine identity failed:', err && err.message));
  }

  async _initChromeExtensions() {
    await this._s.chromeExtensionService.init();
    this._ctx.boot.log('chromeExtensionService.init done');
  }

  _installMenus() {
    try {
      new ContextMenu({ getTabViewManager: () => this._ctx.tabViewManager, db: this._s.db }).install(this._ctx.app);
    } catch (err) {
      this._log.warn('[main] ContextMenu install failed:', err && err.message);
    }
    AppMenu.apply(this._ctx.electron.Menu, this._ctx.proc.platform, this._log);
  }

  _createWindow() {
    this._ctx.boot.log('calling createWindow');
    this._ctx.mainWindowController.create();
    this._ctx.boot.log('createWindow returned');
  }

  _startDeferred(setupComplete) {
    if (setupComplete) this._ctx.deferredServices.start();
    else this._ctx.boot.log('SKIP: chrome-ext loadAll + adblocker init (first-run)');
  }

  _scheduleBackgroundStarts() {
    new BackgroundStarts({
      updateCheck: this._updateCheck,
      llmServerService: this._s.llmServerService,
      imageServerService: this._s.imageServerService,
      env: this._ctx.env,
    }).schedule();
  }
}

module.exports = ReadyPhase;
