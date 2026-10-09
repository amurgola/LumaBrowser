const os = require('os');
const path = require('path');
const ShellPathExpander = require('./ShellPathExpander');

class WritePathScope {
  static UNIX_TEMP_DIRS = ['/tmp', '/var/tmp', '/private/tmp'];

  constructor(start, roots, env) {
    this._roots = roots;
    this._windows = WritePathScope.isWindowsRoot(start) || roots.some(WritePathScope.isWindowsRoot);
    this._path = this._windows ? path.win32 : path.posix;
    this._tempDirs = [os.tmpdir(), ...WritePathScope.UNIX_TEMP_DIRS, ShellPathExpander.lookup(env, 'TEMP'), ShellPathExpander.lookup(env, 'TMP')].filter(Boolean);
  }

  static isWindowsRoot(root) {
    return /^[a-zA-Z]:[\\/]/.test(root) || root.startsWith('\\\\');
  }

  get isWindows() {
    return this._windows;
  }

  get path() {
    return this._path;
  }

  allows(absolute) {
    return this._roots.some((root) => this._contains(absolute, root)) || this._tempDirs.some((dir) => this._contains(absolute, dir));
  }

  normalize(target) {
    let resolved = this._path.resolve(target);
    if (this._windows) resolved = resolved.replace(/\//g, '\\').toLowerCase();
    return resolved.replace(/[\\/]+$/, '') || resolved;
  }

  _contains(absolute, root) {
    const target = this.normalize(absolute);
    const base = this.normalize(root);
    return target === base || target.startsWith(base + this._path.sep);
  }
}

module.exports = WritePathScope;
