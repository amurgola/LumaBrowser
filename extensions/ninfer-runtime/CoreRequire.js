'use strict';

const path = require('path');

class CoreRequire {
  static load(relFromCoreRoot) {
    try {
      return require(path.join(__dirname, '..', '..', 'core', relFromCoreRoot));
    } catch (err) {
      if (!err || err.code !== 'MODULE_NOT_FOUND') throw err;
      return require(path.join(CoreRequire._appRoot(), 'core', relFromCoreRoot));
    }
  }

  static _appRoot() {
    const { app } = require('electron');
    return app.getAppPath();
  }
}

module.exports = CoreRequire;
