const ExtensionGlobals = require('../../core/shell/extensions/ExtensionGlobals');

class AgentModels {
  static isInstalled(modelRef, router = ExtensionGlobals.chatRouter()) {
    const refs = AgentModels._listedRefs(router);
    return !!refs && refs.has(modelRef);
  }

  static isGone(modelRef, router = ExtensionGlobals.chatRouter()) {
    const refs = AgentModels._listedRefs(router);
    return !!refs && !refs.has(modelRef);
  }

  static missing(agents, router = ExtensionGlobals.chatRouter()) {
    const refs = AgentModels._listedRefs(router);
    if (!refs) return [];
    return (agents || [])
      .filter((agent) => agent && agent.modelRef && !refs.has(agent.modelRef))
      .map((agent) => ({ id: agent.id, name: agent.name, modelRef: agent.modelRef }));
  }

  static _listedRefs(router) {
    try {
      const listed = router && typeof router.listModels === 'function' ? router.listModels() : null;
      return listed && Array.isArray(listed.models) ? new Set(listed.models.map((m) => m.ref)) : null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = AgentModels;
