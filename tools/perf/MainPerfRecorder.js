const fs = require('fs');
const path = require('path');
const { performance, monitorEventLoopDelay } = require('perf_hooks');

class MainPerfRecorder {
  static DELAY_RESOLUTION_MS = 10;
  static CPU_PROFILE_FILE = 'main.cpuprofile';
  static NS_PER_MS = 1e6;

  constructor(deps) {
    this._app = deps.app;
    this._webContents = deps.webContents;
    this._session = deps.session;
    this._loadTimer = deps.loadTimer;
    this._outputDir = deps.outputDir;
    this._now = deps.now || (() => performance.now());
    this._delay = deps.delay || monitorEventLoopDelay({ resolution: MainPerfRecorder.DELAY_RESOLUTION_MS });
    this._milestones = [];
  }

  start() {
    this._start = this._now();
    this._delay.enable();
    this._startCpuProfile();
    this._app.on('browser-window-created', (_event, win) => this._watchWindow(win));
    return this;
  }

  mark(event, extra = {}) {
    this._milestones.push({ event, ms: this._now() - this._start, ...extra });
  }

  surface() {
    return {
      stopCpuProfile: () => this.stopCpuProfile(),
      snapshot: () => this.snapshot(),
      resetDelay: () => this._delay.reset(),
    };
  }

  stopCpuProfile() {
    return new Promise((resolve, reject) => this._session.post('Profiler.stop', (error, result) => {
      if (error) return reject(error);
      fs.writeFileSync(path.join(this._outputDir, MainPerfRecorder.CPU_PROFILE_FILE), JSON.stringify(result.profile));
      this._session.disconnect();
      return resolve();
    }));
  }

  snapshot() {
    return {
      milestones: this._milestones,
      modules: this._loadTimer.sortedLoads(),
      eventLoop: this._eventLoop(),
      metrics: this._app.getAppMetrics(),
      contents: this._webContents.getAllWebContents().map((wc) => ({ id: wc.id, pid: wc.getOSProcessId(), url: wc.getURL() })),
      versions: process.versions,
    };
  }

  _startCpuProfile() {
    this._session.connect();
    this._session.post('Profiler.enable');
    this._session.post('Profiler.start');
  }

  _watchWindow(win) {
    this.mark('window-created');
    win.webContents.on('did-finish-load', () => this.mark('did-finish-load', { url: win.webContents.getURL() }));
  }

  _eventLoop() {
    const ns = MainPerfRecorder.NS_PER_MS;
    return { maxMs: this._delay.max / ns, p99Ms: this._delay.percentile(99) / ns, meanMs: this._delay.mean / ns };
  }
}

module.exports = MainPerfRecorder;
