const fs = require('fs');
const path = require('path');
const inspector = require('inspector');
const ProfileSettingsSeeder = require('./ProfileSettingsSeeder');
const ModuleLoadTimer = require('./ModuleLoadTimer');
const MainPerfRecorder = require('./MainPerfRecorder');

class PerformanceEntry {
  static MAIN_FILE = 'main.js';

  constructor(root, { electron, env = process.env, requireMain, loadTimer } = {}) {
    this._root = root;
    this._electron = electron;
    this._env = env;
    this._loadTimer = loadTimer || new ModuleLoadTimer();
    this._requireMain = requireMain || (() => require(path.join(root, PerformanceEntry.MAIN_FILE)));
  }

  execute() {
    this._requireIsolatedProfile();
    this._pointElectronAtProfile();
    ProfileSettingsSeeder.seed(this._env.LUMA_DATA_DIR, this._env);
    const recorder = this._startRecording();
    global.__lumaPerf = recorder.surface();
    this._requireMain();
    recorder.mark('main-required');
    return recorder;
  }

  _requireIsolatedProfile() {
    if (!this._env.LUMA_PERF_OUTPUT || !this._env.LUMA_DATA_DIR) {
      throw new Error('Use scripts/profile-performance.js to supply an isolated profile');
    }
  }

  _pointElectronAtProfile() {
    this._electron.app.setAppPath(this._root);
    this._electron.app.setPath('userData', this._env.LUMA_DATA_DIR);
    fs.mkdirSync(this._env.LUMA_DATA_DIR, { recursive: true });
  }

  _startRecording() {
    return new MainPerfRecorder({
      app: this._electron.app,
      webContents: this._electron.webContents,
      session: new inspector.Session(),
      loadTimer: this._loadTimer.install(),
      outputDir: this._env.LUMA_PERF_OUTPUT,
    }).start();
  }
}

module.exports = PerformanceEntry;
