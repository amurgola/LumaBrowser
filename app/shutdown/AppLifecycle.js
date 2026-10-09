const QuitController = require('../../core/shell/QuitController');
const ChildProcessRegistry = require('../../core/shell/ChildProcessRegistry');
const ShutdownSequence = require('./ShutdownSequence');

class AppLifecycle {
  static QUIT_TIMEOUT_MS = 5000;

  constructor(ctx, { shutdown = null, log = console } = {}) {
    this._ctx = ctx;
    this._s = ctx.services;
    this._shutdown = shutdown || new ShutdownSequence(ctx, { log });
    this._log = log;
  }

  wire() {
    this._wireSignals();
    this._ctx.quitController = this._buildQuitController();
    const app = this._ctx.app;
    app.on('before-quit', (event) => this.onBeforeQuit(event));
    app.on('child-process-gone', (_event, details) => this.onChildProcessGone(details));
    app.on('window-all-closed', () => this.onAllWindowsClosed());
    app.on('activate', () => this.onActivate());
  }

  async quitCleanup() {
    const s = this._s;
    s.pulseService.stop();
    try { s.faviconCache.flush(); } catch (_) {}
    try { if (global.__lumaResolutionCache) global.__lumaResolutionCache.flush(); } catch (_) {}
    await this._shutdown.run();
    s.db.close();
    try { s.activityLogService.destroy(); } catch (_) {}
    try { s.ragService.close(); } catch (_) {}
    try { if (s.docsKnowledgeBase) s.docsKnowledgeBase.close(); } catch (_) {}
  }

  onBeforeQuit(event) {
    event.preventDefault();
    const controller = this._ctx.quitController;
    if (controller.isQuitting) return null;
    this._log.log('App before-quit, cleaning up...');
    try { this._s.cliHandshake.remove(); } catch (_) {}
    return controller.requestQuit().then((outcome) => {
      if (outcome === 'kept-open') this._log.warn('[quit] kept open after a hung shutdown; services may be partially stopped until the next quit');
      return outcome;
    }).catch((err) => {
      this._log.error('[quit] quit controller failed, forcing exit:', err && err.message);
      this._ctx.app.exit(1);
    });
  }

  onChildProcessGone(details) {
    if (!details || details.reason === 'clean-exit') return false;
    this._log.warn(`[main] child process gone: type=${details.type} name=${details.name || ''} reason=${details.reason} exit=${details.exitCode}`);
    return true;
  }

  onAllWindowsClosed() {
    this._s.restGateway.stop();
    this._ctx.app.quit();
  }

  onActivate() {
    const windows = this._ctx.mainWindowController;
    if (windows.wasClosed()) return windows.create();
    if (this._ctx.rendererRecovery && this._ctx.rendererRecovery.suspended) return windows.show();
    return null;
  }

  _wireSignals() {
    for (const signal of ['SIGINT', 'SIGTERM']) {
      this._ctx.proc.on(signal, async () => {
        this._log.log(`Received ${signal}, cleaning up...`);
        await this._shutdown.run();
        this._ctx.proc.exit(0);
      });
    }
  }

  _buildQuitController() {
    const { app, dialog } = this._ctx.electron;
    return new QuitController({
      timeoutMs: AppLifecycle.QUIT_TIMEOUT_MS,
      log: this._log,
      cleanup: () => this.quitCleanup(),
      exit: (code) => app.exit(code),
      showDialog: (opts) => dialog.showMessageBox(opts),
      killChildren: () => ChildProcessRegistry.killAll({ log: this._log }),
      canPrompt: () => !this._ctx.env.LUMA_DOCKER && Boolean(this._ctx.liveWindow()),
    });
  }
}

module.exports = AppLifecycle;
