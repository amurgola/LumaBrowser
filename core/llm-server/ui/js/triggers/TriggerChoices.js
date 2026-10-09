export default class TriggerChoices {
  static async agents(api) {
    try {
      if (api && api.setup && typeof api.setup.invoke === 'function') {
        const r = await api.setup.invoke('agent-manager', 'list');
        const agents = r && r.success && r.result && r.result.agents;
        return Array.isArray(agents) ? agents : [];
      }
    } catch (_) {}
    return [];
  }

  static async persistedTabs(api) {
    try {
      const r = api && api.triggers && typeof api.triggers.persistedTabs === 'function' ? await api.triggers.persistedTabs() : null;
      return r && r.success && Array.isArray(r.tabs) ? r.tabs : [];
    } catch (_) {
      return [];
    }
  }
}
