const path = require('path');

class AppModules {
  static load(name, { roots = [], requireFrom = require } = {}) {
    try {
      return requireFrom(name);
    } catch (error) {
      if (!AppModules._isMissing(error)) throw error;
      return AppModules._loadFromRoots(name, [...roots, ...AppModules.appRoots()], requireFrom, error);
    }
  }

  static appRoots({ env = process.env, resourcesPath = process.resourcesPath, appPath = AppModules._electronAppPath() } = {}) {
    const roots = [];
    if (env.LUMA_APP_ROOT) roots.push(env.LUMA_APP_ROOT);
    if (appPath) roots.push(appPath);
    if (resourcesPath) roots.push(path.join(resourcesPath, 'app.asar'));
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

  static _loadFromRoots(name, roots, requireFrom, firstError) {
    let last = firstError;
    for (const root of roots) {
      try {
        return requireFrom(path.join(root, 'node_modules', name));
      } catch (error) {
        if (!AppModules._isMissing(error)) throw error;
        last = error;
      }
    }
    throw last;
  }

  static _isMissing(error) {
    return !!error && error.code === 'MODULE_NOT_FOUND';
  }
}

module.exports = AppModules;
