export default class AgentDirectory {
  static async list(api) {
    try {
      if (api && api.setup && typeof api.setup.invoke === 'function') return await AgentDirectory._fromSetup(api);
      if (window.LumaAPI && typeof window.LumaAPI.listAgents === 'function') return await window.LumaAPI.listAgents();
    } catch (_) {}
    return [];
  }

  static async _fromSetup(api) {
    const r = await api.setup.invoke('agent-manager', 'list');
    const agents = r && r.success && r.result && r.result.agents;
    return Array.isArray(agents) ? agents : [];
  }
}
