class DeferredServices {
  constructor(ctx, { log = console } = {}) {
    this._ctx = ctx;
    this._s = ctx.services;
    this._log = log;
    this._promise = null;
  }

  start() {
    if (!this._promise) this._promise = this._run();
    return this._promise;
  }

  async _run() {
    this._ctx.boot.log('startDeferredServices: begin');
    const session = this._ctx.electron.session.defaultSession;
    await this._loadChromeExtensions(session);
    await this._startAdblocker(session);
    await Promise.resolve(this._ctx.identityReady).catch(() => {});
    await this._runHeavyPhase();
  }

  async _loadChromeExtensions(session) {
    try {
      await this._s.chromeExtensionService.loadAllEnabled(session);
      this._s.chromeExtensionService.ready = true;
      this._ctx.boot.log('startDeferredServices: chrome-ext loaded');
    } catch (err) {
      this._log.error('chrome-ext loadAllEnabled failed:', err);
    }
  }

  async _startAdblocker(session) {
    try {
      await this._s.adblockerService.init();
      this._s.adblockerService.ready = true;
      this._s.adblockerService.applyToSession(session);
      this._ctx.boot.log('startDeferredServices: adblocker ready');
    } catch (err) {
      this._log.error('adblocker init failed:', err);
    }
  }

  async _runHeavyPhase() {
    if (!this._ctx.heavyServices) return;
    try {
      await this._ctx.heavyServices.run();
      this._ctx.boot.log('startDeferredServices: heavy window services done');
    } catch (err) {
      this._log.error('heavy window services failed:', err);
    }
  }
}

module.exports = DeferredServices;
