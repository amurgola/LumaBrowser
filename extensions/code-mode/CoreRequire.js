const path = require('path');

class CoreRequire {
  static require(relFromCoreRoot) {
    try {
      return require(CoreRequire._bundledPath(relFromCoreRoot));
    } catch (err) {
      if (!err || err.code !== 'MODULE_NOT_FOUND') throw err;
      return require(CoreRequire._appRootPath(relFromCoreRoot));
    }
  }

  static _bundledPath(relFromCoreRoot) {
    return path.join(__dirname, '..', '..', 'core', relFromCoreRoot);
  }

  static _appRootPath(relFromCoreRoot) {
    const { app } = require('electron');
    return path.join(app.getAppPath(), 'core', relFromCoreRoot);
  }
}

module.exports = CoreRequire;
