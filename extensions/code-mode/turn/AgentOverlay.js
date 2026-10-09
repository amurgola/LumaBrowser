class AgentOverlay {
  static MISSING_PERSONA = 'The agent this session was started with no longer exists; continue as the plain Code agent and mention that once.';

  static resolve(data, agentManager = global.__lumaAgentManager) {
    const agentId = data && data.agentId ? String(data.agentId) : '';
    if (!agentId) return null;
    const turn = AgentOverlay._agentTurn(agentManager, agentId);
    if (!turn) return { persona: null, allowedTools: [], kbScope: null, modelRef: null, missing: true };
    return {
      persona: turn.systemPrompt ? String(turn.systemPrompt) : null,
      allowedTools: Array.isArray(turn.allowedTools) ? turn.allowedTools.slice() : [],
      kbScope: turn.kbScope ? String(turn.kbScope) : null,
      modelRef: turn.modelRef ? String(turn.modelRef) : null,
      missing: false,
    };
  }

  static personaOf(overlay) {
    if (!overlay) return null;
    return overlay.missing ? AgentOverlay.MISSING_PERSONA : overlay.persona;
  }

  static mergeAllowedTools(allowedTools, overlay) {
    if (!overlay || !allowedTools || !overlay.allowedTools.length) return allowedTools;
    return [...new Set([...allowedTools, ...overlay.allowedTools])];
  }

  static turnFields(overlay) {
    if (!overlay || overlay.missing) return {};
    return {
      ...(overlay.kbScope ? { kbScope: overlay.kbScope } : {}),
      ...(overlay.modelRef ? { modelRef: overlay.modelRef } : {}),
    };
  }

  static _agentTurn(agentManager, agentId) {
    try {
      return agentManager && typeof agentManager.buildTurn === 'function' ? agentManager.buildTurn(agentId) : null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = AgentOverlay;
