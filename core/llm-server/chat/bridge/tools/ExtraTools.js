class ExtraTools {
  static normalize(extraTools) {
    const injected = Array.isArray(extraTools)
      ? extraTools.filter((t) => t && t.name && typeof t.handler === 'function')
      : [];
    return {
      defs: injected.map(ExtraTools._definition),
      handlers: new Map(injected.map((t) => [t.name, t.handler])),
      sandboxed: new Set(injected.filter((t) => t.sandboxed === true).map((t) => t.name)),
      roots: new Map(injected
        .filter((t) => typeof t.projectRoot === 'string' && t.projectRoot)
        .map((t) => [t.name, t.projectRoot])),
      evictionHooks: new Map(injected
        .filter((t) => typeof t.onResultEvicted === 'function')
        .map((t) => [t.name, t.onResultEvicted])),
    };
  }

  static _definition(t) {
    return {
      name: t.name,
      description: t.description || '',
      inputSchema: t.inputSchema || { type: 'object', properties: {} },
      mutating: t.mutating === true,
    };
  }
}

module.exports = ExtraTools;
