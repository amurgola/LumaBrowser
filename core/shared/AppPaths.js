const fs = require('fs');
const path = require('path');

class AppPaths {
  static MANAGED_DIRS = ['models', 'runtimes'];
  static WINDOWS_APP_DIR = 'LumaBrowser';

  static _shared = null;

  constructor({ app, env = process.env, platform = process.platform, execPath = process.execPath } = {}) {
    this._app = app;
    this._env = env;
    this._platform = platform;
    this._execDir = path.dirname(execPath);
    this._baseDir = null;
    this._migration = null;
  }

  static appBaseDir() {
    return AppPaths._sharedInstance().resolveBaseDir();
  }

  static appBaseDirMigration() {
    return AppPaths._sharedInstance().migration();
  }

  resolveBaseDir() {
    if (!this._baseDir) this._baseDir = this._chooseBaseDir();
    return this._baseDir;
  }

  migration() {
    return this._migration;
  }

  static _sharedInstance() {
    if (!AppPaths._shared) AppPaths._shared = new AppPaths({ app: require('electron').app });
    return AppPaths._shared;
  }

  _chooseBaseDir() {
    if (!this._app.isPackaged) return this._app.getAppPath();
    if (this._env.APPIMAGE) return this._userData();
    if (this._platform === 'win32') return this._chooseWindowsBaseDir();
    if (this._platform === 'darwin') return this._relocateBase(this._userData());
    return this._isWritable(this._execDir) ? this._execDir : this._userData();
  }

  _chooseWindowsBaseDir() {
    if (this._env.PORTABLE_EXECUTABLE_DIR) return this._env.PORTABLE_EXECUTABLE_DIR;
    const local = this._env.LOCALAPPDATA;
    const target = local ? path.join(local, AppPaths.WINDOWS_APP_DIR) : this._userData();
    return this._relocateBase(target);
  }

  _relocateBase(newBase) {
    const results = AppPaths.MANAGED_DIRS.map((name) => this._moveManagedDir(name, newBase));
    const modelsMoved = results[0];
    if (!modelsMoved) return this._execDir;
    this._migration = { from: this._execDir, to: newBase };
    return newBase;
  }

  _moveManagedDir(name, newBase) {
    const from = path.join(this._execDir, name);
    const to = path.join(newBase, name);
    try {
      if (!fs.existsSync(from) || fs.existsSync(to)) return true;
      fs.mkdirSync(newBase, { recursive: true });
      fs.renameSync(from, to);
      return true;
    } catch (err) {
      console.warn(`[AppPaths] could not migrate ${from} -> ${to}: ${err.message}`);
      return false;
    }
  }

  _isWritable(dir) {
    try {
      fs.accessSync(dir, fs.constants.W_OK);
      return true;
    } catch (_) {
      return false;
    }
  }

  _userData() {
    return this._app.getPath('userData');
  }
}

module.exports = AppPaths;
