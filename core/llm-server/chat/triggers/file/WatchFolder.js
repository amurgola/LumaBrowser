const fs = require('fs');
const path = require('path');
const ContainedPath = require('../../../../shared/fs/ContainedPath');

class WatchFolder {
  static validate(dir, { forbiddenRoots = [] } = {}) {
    if (!dir || typeof dir !== 'string' || !path.isAbsolute(dir.trim())) throw new Error('the watch folder must be an absolute path');
    const real = WatchFolder._realPath(dir);
    WatchFolder._assertDirectory(real, dir);
    if (path.parse(real).root === real) throw new Error('refusing to watch a drive root; pick a folder');
    if (forbiddenRoots.some((root) => WatchFolder._isAtOrInside(real, root))) {
      throw new Error('refusing to watch inside the application or its data folder');
    }
    return real;
  }

  static resolveInside(dir, candidate) {
    const abs = path.resolve(dir, String(candidate || ''));
    if (abs !== dir && !ContainedPath.isWithin(dir, abs)) throw new Error('path is outside the watch folder');
    return abs;
  }

  static _realPath(dir) {
    try {
      return fs.realpathSync(dir.trim());
    } catch (_) {
      throw new Error(`the watch folder does not exist: ${dir}`);
    }
  }

  static _assertDirectory(real, dir) {
    let stat;
    try {
      stat = fs.statSync(real);
    } catch (_) {
      throw new Error(`the watch folder cannot be read: ${dir}`);
    }
    if (!stat.isDirectory()) throw new Error(`not a folder: ${dir}`);
  }

  static _isAtOrInside(real, root) {
    if (!root) return false;
    const rootReal = WatchFolder._realOrResolved(root);
    return real === rootReal || ContainedPath.isWithin(rootReal, real);
  }

  static _realOrResolved(p) {
    try {
      return fs.realpathSync(p);
    } catch (_) {
      return path.resolve(p);
    }
  }
}

module.exports = WatchFolder;
