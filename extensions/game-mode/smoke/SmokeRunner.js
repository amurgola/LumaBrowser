const fs = require('fs');
const os = require('os');
const path = require('path');
const GameFlattener = require('../flatten/GameFlattener');
const SmokeActions = require('./SmokeActions');
const SmokeCollectorScript = require('./SmokeCollectorScript');
const SmokeConsole = require('./SmokeConsole');
const SmokeFrameCapture = require('./SmokeFrameCapture');

class SmokeRunner {
  static DEFAULT_SECONDS = 8;
  static MIN_SECONDS = 3;
  static MAX_SECONDS = 30;
  static LOAD_TIMEOUT_MS = 15000;
  static REPORT_TIMEOUT_MS = 5000;
  static WIN_W = 960;
  static WIN_H = 720;

  static _inFlight = false;

  static clampSeconds(n) {
    const v = Number(n);
    if (!Number.isFinite(v) || v <= 0) return SmokeRunner.DEFAULT_SECONDS;
    return Math.max(SmokeRunner.MIN_SECONDS, Math.min(SmokeRunner.MAX_SECONDS, Math.round(v)));
  }

  static resolveBrowserWindow() {
    let electron = null;
    try { electron = require('electron'); } catch (_) { return null; }
    if (!electron || typeof electron !== 'object') return null;
    const { BrowserWindow, app } = electron;
    if (typeof BrowserWindow !== 'function') return null;
    try { return app && app.isReady() ? BrowserWindow : null; } catch (_) { return null; }
  }

  static run(options) {
    return new SmokeRunner(options).execute();
  }

  constructor({ gameDir, seconds, actions, url = null, screenshots = true, shotDir = null, BrowserWindow, sleep }) {
    this._gameDir = gameDir;
    this._secs = SmokeRunner.clampSeconds(seconds);
    this._actions = SmokeActions.normalize(actions);
    const lastAt = this._actions.length ? this._actions[this._actions.length - 1].at : 0;
    this._runMs = Math.max(this._secs * 1000, lastAt + 2000);
    this._url = url;
    this._screenshots = screenshots;
    this._shotDir = shotDir;
    this._BrowserWindow = BrowserWindow === undefined ? SmokeRunner.resolveBrowserWindow() : BrowserWindow;
    this._sleep = sleep || ((ms) => new Promise((r) => setTimeout(r, ms)));
  }

  async execute() {
    if (!this._BrowserWindow) return { available: false, seconds: this._secs };
    if (SmokeRunner._inFlight) return { available: false, busy: true, seconds: this._secs };
    if (!this._url) {
      try { this._flat = GameFlattener.flatten(this._gameDir, { sourceUrls: true }); } catch (e) {
        return { available: true, flattenError: e.message, seconds: this._secs };
      }
    }
    SmokeRunner._inFlight = true;
    try {
      return await this._runWindow();
    } catch (e) {
      return { available: true, loaded: false, loadError: e.message, consoleErrors: [], consoleLines: [], seconds: this._secs, url: this._url || null };
    } finally {
      SmokeRunner._inFlight = false;
      this._cleanUp();
    }
  }

  async _runWindow() {
    this._writeFiles();
    this._openWindow();
    const loadError = await this._load();
    if (loadError) {
      return { available: true, loaded: false, loadError, consoleErrors: this._console.errors, consoleLines: this._console.lines, seconds: this._secs, url: this._url || null };
    }
    await this._captureTimeline();
    return {
      available: true,
      loaded: true,
      report: await this._readReport(),
      consoleErrors: this._console.errors,
      consoleLines: this._console.lines,
      shots: this._capture.shots,
      actions: this._actions,
      seconds: Math.round(this._runMs / 1000),
      url: this._url || null,
    };
  }

  _writeFiles() {
    this._tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'luma-smoke-'));
    this._preload = path.join(this._tmpDir, 'collector.js');
    fs.writeFileSync(this._preload, SmokeCollectorScript.source(this._runMs, this._actions), 'utf8');
    if (!this._flat) return;
    this._page = path.join(this._tmpDir, 'game.html');
    fs.writeFileSync(this._page, this._flat.html, 'utf8');
  }

  _openWindow() {
    this._win = new this._BrowserWindow({
      show: false,
      width: SmokeRunner.WIN_W,
      height: SmokeRunner.WIN_H,
      webPreferences: {
        offscreen: true,
        backgroundThrottling: false,
        sandbox: false,
        contextIsolation: false,
        nodeIntegration: false,
        preload: this._preload,
        autoplayPolicy: 'no-user-gesture-required',
      },
    });
    this._win.webContents.setAudioMuted(true);
    this._capture = new SmokeFrameCapture({ win: this._win, shotDir: this._shotDir, sleep: this._sleep });
    this._capture.attach();
    this._console = new SmokeConsole();
    this._console.attach(this._win.webContents);
  }

  async _load() {
    const timeoutMs = SmokeRunner.LOAD_TIMEOUT_MS;
    try {
      await Promise.race([
        this._url ? this._win.loadURL(this._url) : this._win.loadFile(this._page),
        this._sleep(timeoutMs).then(() => { throw new Error(`load timed out after ${timeoutMs / 1000}s`); }),
      ]);
      return null;
    } catch (e) { return e.message; }
  }

  async _captureTimeline() {
    let elapsed = 0;
    for (const mark of this._marks()) {
      const wait = mark.at - elapsed;
      if (wait > 0) await this._sleep(wait);
      elapsed = Math.max(elapsed, mark.at);
      if (this._screenshots) await this._capture.snap(mark.label, mark.at);
    }
  }

  _marks() {
    const marks = [{ at: Math.min(1500, this._runMs - 500), label: 'boot' }];
    this._actions.forEach((a, i) => marks.push({ at: Math.min(this._runMs - 200, a.at + 800), label: `after-${i + 1}-${a.type}` }));
    marks.push({ at: this._runMs, label: 'final' });
    return marks.sort((p, q) => p.at - q.at);
  }

  async _readReport() {
    try {
      const raw = await Promise.race([
        this._win.webContents.executeJavaScript('window.__lumaSmokeReport ? window.__lumaSmokeReport() : "null"', true),
        this._sleep(SmokeRunner.REPORT_TIMEOUT_MS).then(() => 'null'),
      ]);
      return JSON.parse(raw);
    } catch (_) { return null; }
  }

  _cleanUp() {
    try { if (this._win && !this._win.isDestroyed()) this._win.destroy(); } catch (_) {}
    try { if (this._tmpDir) fs.rmSync(this._tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
}

module.exports = SmokeRunner;
