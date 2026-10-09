const CrashTracer = require('../../core/diagnostics/CrashTracer');
const DebugLog = require('../../core/DebugLog');
const ChromeIdentity = require('../../core/browser/ChromeIdentity');
const UnhandledRejectionTap = require('./UnhandledRejectionTap');

class ProcessSetup {
  static SWITCHES = [['enable-features', 'UseSkiaRenderer'], ['force-color-profile', 'srgb'], ['disable-features', 'CalculateNativeWinOcclusion']];
  static LINUX_SWITCHES = [['enable-transparent-visuals']];

  constructor(ctx, { crashTracer = CrashTracer, debugLog = DebugLog, log = console } = {}) {
    this._ctx = ctx;
    this._crashTracer = crashTracer;
    this._debugLog = debugLog;
    this._log = log;
  }

  run() {
    this._isolateDataDir();
    this._crashTracer.install();
    if (!this._takeInstanceLock()) return false;
    if (this._ctx.isDev) this._installDevConsoleBuffer();
    UnhandledRejectionTap.install(this._ctx.proc, this._log);
    this._ctx.app.userAgentFallback = ChromeIdentity.USER_AGENT;
    this._appendSwitches();
    return true;
  }

  _isolateDataDir() {
    const override = this._ctx.env.LUMA_DATA_DIR;
    if (override) this._ctx.app.setPath('userData', override);
    this._ctx.dataDir = override || this._ctx.app.getPath('userData');
  }

  _takeInstanceLock() {
    const app = this._ctx.app;
    if (!app.requestSingleInstanceLock()) {
      app.exit(0);
      return false;
    }
    app.on('second-instance', () => this._focusExistingWindow());
    return true;
  }

  _focusExistingWindow() {
    const win = this._ctx.liveWindow();
    if (!win) return false;
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
    return true;
  }

  _installDevConsoleBuffer() {
    try { this._debugLog.install(); } catch (_) {}
  }

  _appendSwitches() {
    const switches = ProcessSetup.SWITCHES.concat(this._ctx.proc.platform === 'linux' ? ProcessSetup.LINUX_SWITCHES : []);
    for (const args of switches) this._ctx.app.commandLine.appendSwitch(...args);
  }
}

module.exports = ProcessSetup;
