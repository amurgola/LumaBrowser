const ExtensionGlobals = require('../../core/shell/extensions/ExtensionGlobals');

class AgentModels {
  static isInstalled(modelRef, router = ExtensionGlobals.chatRouter()) {
    try {
      const listed = router && typeof router.listModels === 'function' ? router.listModels() : null;
      return !!(listed && Array.isArray(listed.models) && listed.models.some((m) => m.ref === modelRef));
    } catch (_) {
      return false;
    }
  }
}

module.exports = AgentModels;
