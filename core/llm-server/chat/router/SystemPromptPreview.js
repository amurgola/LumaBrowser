class SystemPromptPreview {
  static NOT_READY = 'Agent tools are unavailable (browser/extensions not ready yet).';

  constructor({ policy, agentBridge, getAgentDeps }) {
    this._policy = policy;
    this._bridge = agentBridge;
    this._getAgentDeps = getAgentDeps;
  }

  build(opts = {}) {
    const deps = this._getAgentDeps ? this._getAgentDeps() : null;
    if (!deps) return { success: false, error: SystemPromptPreview.NOT_READY };
    try {
      const out = this._bridge.buildPreviewSystemPrompt(SystemPromptPreview._request(deps, this._policy.globalAllowList(deps), opts));
      return { success: true, ...out };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  static _request(deps, allowedTools, opts) {
    return {
      deps,
      allowedTools,
      modelRef: opts.modelRef || null,
      modeSystemPrompt: opts.modeSystemPrompt || null,
      withImages: Number(opts.withImages) || 0,
    };
  }
}

module.exports = SystemPromptPreview;
