const AppGlobals = require('../AppGlobals');
const ViewStackDump = require('./ViewStackDump');

class DebugIpc {
  static TRACE_CHANNEL = 'debug:runtime-trace';
  static VIEW_STACK_CHANNEL = 'debug:view-stack';
  static MIN_TRACE_MS = 3000;
  static MAX_TRACE_MS = 120000;
  static DEFAULT_TRACE_MS = 15000;

  constructor(ctx, { log = console, createTracer = DebugIpc._createTracer } = {}) {
    this._ctx = ctx;
    this._log = log;
    this._createTracer = createTracer;
    this._tracer = null;
  }

  register(ipcMain) {
    ipcMain.handle(DebugIpc.TRACE_CHANNEL, (_event, opts) => this.runtimeTrace(opts));
    ipcMain.handle(DebugIpc.VIEW_STACK_CHANNEL, () => this.viewStack());
  }

  async runtimeTrace(opts = {}) {
    const tracer = this._getTracer();
    if (tracer.isRunning()) return { success: false, error: 'A runtime trace is already running' };
    try {
      const result = await tracer.start({ durationMs: DebugIpc.clampDuration(opts && opts.durationMs), label: opts && opts.label });
      return { success: true, ...result };
    } catch (err) {
      this._log.error('[runtime-trace] failed', err);
      return { success: false, error: err.message };
    }
  }

  viewStack() {
    return new ViewStackDump({
      win: this._ctx.mainWindow,
      tabViewManager: this._ctx.tabViewManager,
      chromeOverlay: this._ctx.chromeOverlay,
      userDataDir: this._ctx.app.getPath('userData'),
      log: this._log,
    }).capture();
  }

  static clampDuration(ms) {
    return Math.min(DebugIpc.MAX_TRACE_MS, Math.max(DebugIpc.MIN_TRACE_MS, Number(ms) || DebugIpc.DEFAULT_TRACE_MS));
  }

  _getTracer() {
    if (!this._tracer) this._tracer = AppGlobals.publish('__lumaRuntimeTracer', this._createTracer({ getWindow: () => this._ctx.mainWindow }));
    return this._tracer;
  }

  static _createTracer(opts) {
    const RuntimeTracer = require('../../core/diagnostics/RuntimeTracer');
    return new RuntimeTracer(opts);
  }
}

module.exports = DebugIpc;
