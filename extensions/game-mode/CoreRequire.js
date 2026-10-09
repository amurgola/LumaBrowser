const path = require('path');

class CoreRequire {
  static load(relFromCoreRoot) {
    try {
      return require(CoreRequire._besideCore(relFromCoreRoot));
    } catch (err) {
      if (!CoreRequire._isNotFound(err)) throw err;
      return require(CoreRequire._fromAppRoot(relFromCoreRoot));
    }
  }

  static _besideCore(rel) {
    return path.join(__dirname, '..', '..', 'core', rel);
  }

  static _fromAppRoot(rel) {
    const { app } = require('electron');
    return path.join(app.getAppPath(), 'core', rel);
  }

  static _isNotFound(err) {
    return !!err && err.code === 'MODULE_NOT_FOUND';
  }
}

module.exports = CoreRequire;
