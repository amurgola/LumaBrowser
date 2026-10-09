class LlmIpcDeps {
  constructor(deps = {}) {
    this._deps = deps || {};
  }

  get(name) {
    return this._deps[name] || null;
  }

  agentDeps() {
    return typeof this._deps.getAgentDeps === 'function' ? this._deps.getAgentDeps() : null;
  }

  artifactStore() {
    const agentDeps = this.agentDeps();
    return (agentDeps && agentDeps.artifactStore) || null;
  }

  imageServerService() {
    return this._deps.imageServerService || global.__lumaImageServerService || null;
  }

  emit(emitterName, type, payload) {
    try {
      const emitter = this._deps[emitterName];
      if (typeof emitter === 'function') emitter(type, payload || {});
    } catch (_) {
    }
  }
}

module.exports = LlmIpcDeps;
