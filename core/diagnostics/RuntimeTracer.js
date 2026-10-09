const fs = require('fs');
const path = require('path');
const RuntimeTraceCapture = require('./RuntimeTraceCapture');

class RuntimeTracer {
  static DEFAULT_DURATION_MS = 15000;

  constructor({ getWindow, outputRoot, electron, captureFactory } = {}) {
    this._getWindow = getWindow;
    this._electron = electron || require('electron');
    this._outputRoot = outputRoot || RuntimeTracer.defaultOutputRoot(this._electron.app);
    this._captureFactory = captureFactory || ((opts) => new RuntimeTraceCapture(opts));
    this._active = null;
  }

  static defaultOutputRoot(app = require('electron').app) {
    return app.isPackaged
      ? path.join(app.getPath('userData'), 'perf-traces')
      : path.join(app.getAppPath(), 'test-data', 'performance');
  }

  isRunning() {
    return !!this._active;
  }

  async start({ durationMs = RuntimeTracer.DEFAULT_DURATION_MS, label } = {}) {
    if (this._active) throw new Error('A runtime trace is already running');
    const webContents = this._requireShellWebContents();
    const dir = this._createOutputDir(label);
    this._active = this._captureFactory({ electron: this._electron, webContents, dir, durationMs });
    try {
      return await this._active.execute();
    } finally {
      this._active = null;
    }
  }

  _requireShellWebContents() {
    const win = this._getWindow();
    if (!win || win.isDestroyed()) throw new Error('Shell window is not available');
    return win.webContents;
  }

  _createOutputDir(label) {
    const dir = path.join(this._outputRoot, RuntimeTracer.safeLabel(label));
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  static safeLabel(label, now = new Date()) {
    const raw = label || `drag-${now.toISOString().replace(/[:.]/g, '-')}`;
    return String(raw).replace(/[^a-zA-Z0-9_-]/g, '_');
  }
}

module.exports = RuntimeTracer;
