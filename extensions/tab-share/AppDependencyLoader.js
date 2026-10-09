const path = require('path');

class AppDependencyLoader {
  static load(name, { roots = [] } = {}) {
    try {
      return require(name);
    } catch (err) {
      if (!AppDependencyLoader._isMissing(err)) throw err;
      return AppDependencyLoader._loadFromRoots(name, [...roots, ...AppDependencyLoader._appRoots()], err);
    }
  }

  static _appRoots() {
    const roots = [];
    if (process.env.LUMA_APP_ROOT) roots.push(process.env.LUMA_APP_ROOT);
    const appPath = AppDependencyLoader._electronAppPath();
    if (appPath) roots.push(appPath);
    if (process.resourcesPath) roots.push(path.join(process.resourcesPath, 'app.asar'));
    return roots;
  }

  static _electronAppPath() {
    try {
      const { app } = require('electron');
      return app && typeof app.getAppPath === 'function' ? app.getAppPath() : null;
    } catch (_) {
      return null;
    }
  }

  static _loadFromRoots(name, roots, firstError) {
    let last = firstError;
    for (const root of roots) {
      try {
        return require(path.join(root, 'node_modules', name));
      } catch (err) {
        if (!AppDependencyLoader._isMissing(err)) throw err;
        last = err;
      }
    }
    throw last;
  }

  static _isMissing(err) {
    return !!err && err.code === 'MODULE_NOT_FOUND';
  }
}

module.exports = AppDependencyLoader;
