class TerminalAgents {
  static resolve(agentManager, nameOrId) {
    if (!agentManager || typeof agentManager.listAgents !== 'function') return null;
    const key = String(nameOrId).trim().toLowerCase();
    const agents = agentManager.listAgents() || [];
    return agents.find((a) => String(a.id).toLowerCase() === key)
      || agents.find((a) => String(a.name || '').trim().toLowerCase() === key)
      || null;
  }

  static turnOf(agentManager, agentId) {
    try { return agentManager.buildTurn(agentId); } catch (_) { return null; }
  }

  static listing(agentManager, router) {
    const agents = agentManager && typeof agentManager.listAgents === 'function' ? agentManager.listAgents() : [];
    const defaultRef = TerminalAgents.defaultModel(router);
    const rows = agents.map((a) => TerminalAgents._row(agentManager, a, defaultRef));
    return { agents: rows, defaultModel: defaultRef };
  }

  static defaultModel(router) {
    try { return router && router.listModels ? (router.listModels().defaultRef || null) : null; } catch (_) { return null; }
  }

  static _row(agentManager, a, defaultRef) {
    const turn = TerminalAgents.turnOf(agentManager, a.id);
    return {
      id: a.id,
      name: a.name,
      description: a.description || '',
      model: (turn && turn.modelRef) || defaultRef,
      tools: turn && Array.isArray(turn.allowedTools) ? turn.allowedTools.length : 0,
      kbDocs: a.kbDocs || 0,
    };
  }
}

module.exports = TerminalAgents;
