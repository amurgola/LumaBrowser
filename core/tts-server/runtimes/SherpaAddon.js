const path = require('path');

class SherpaAddon {
  static ENTRY_FILE = 'sherpa-onnx.js';

  static load(addonDir) {
    return require(path.join(addonDir, SherpaAddon.ENTRY_FILE));
  }

  static async create(EngineClass, config) {
    if (EngineClass && typeof EngineClass.createAsync === 'function') return EngineClass.createAsync(config);
    return new EngineClass(config);
  }

  static errorMessage(err) {
    return (err && err.message) || String(err);
  }
}

module.exports = SherpaAddon;
