const CoreRequire = require('../CoreRequire');

const ExtensionGlobals = CoreRequire.require('shell/extensions/ExtensionGlobals');

class DecodeSlots {
  static count(service = ExtensionGlobals.llmServerService()) {
    try {
      const n = service && typeof service.getDefaults === 'function' && service.getDefaults().maxConcurrent;
      return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
    } catch (_) {
      return 1;
    }
  }
}

module.exports = DecodeSlots;
