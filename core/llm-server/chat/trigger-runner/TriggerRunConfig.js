class TriggerRunConfig {
  static ARTIFACT_TOOLS = ['get_artifact_data', 'update_artifact_data'];

  constructor({ toolPolicy, getAgentManager = () => null }) {
    this._toolPolicy = toolPolicy;
    this._getAgentManager = getAgentManager;
  }

  resolve(trigger, deps) {
    const action = trigger.action || {};
    const setup = this._toolPolicy.runConfig(trigger.conversationId, deps);
    const forced = action.artifactRootId ? TriggerRunConfig.ARTIFACT_TOOLS : [];
    if (action.mode === 'prompt') return { modelRef: setup.modelRef, allowedTools: [...forced] };
    if (action.agentId) return this._agentConfig(action.agentId, setup.modelRef, forced);
    return { modelRef: setup.modelRef, allowedTools: TriggerRunConfig._withForced(setup.allowedTools, forced) };
  }

  _agentConfig(agentId, setupModelRef, forced) {
    const manager = this._getAgentManager();
    const turn = manager && typeof manager.buildTurn === 'function' ? manager.buildTurn(agentId) : null;
    if (!turn || !manager) {
      throw new Error(`the configured agent "${agentId}" ${manager ? 'no longer exists' : 'is unavailable (Agent Manager is off)'}; pick another agent in the setup chat`);
    }
    const allowedTools = [...new Set([...(Array.isArray(turn.allowedTools) ? turn.allowedTools : []), ...forced])];
    return { modelRef: turn.modelRef || setupModelRef, allowedTools, persona: turn.systemPrompt || null, kbScope: turn.kbScope || null, agentId };
  }

  static _withForced(allowedTools, forced) {
    if (!Array.isArray(allowedTools)) return allowedTools;
    const out = [...allowedTools];
    for (const name of forced) if (!out.includes(name)) out.push(name);
    return out;
  }
}

module.exports = TriggerRunConfig;
