const GrantableTools = require('./GrantableTools');

class AgentSetupInvoke {
  constructor(manager, dialogs) {
    this._manager = manager;
    this._dialogs = dialogs;
  }

  async handle(action, payload = {}) {
    const m = this._manager;
    const p = payload || {};
    switch (action) {
      case 'list': return { agents: m.listWithKnowledge() };
      case 'create': return { agent: m.createAgent(p) };
      case 'update': return { agent: m.store.update(p.id, p.patch || {}) };
      case 'delete': return { removed: m.deleteAgent(p.id) };
      case 'tools': return { groups: GrantableTools.groups() };
      case 'export': return this._dialogs.exportToFile(m.requireAgent(p.id));
      case 'import': return this._dialogs.importFromFile();
      case 'kb.list': return { documents: m.knowledge.documents(m.requireAgent(p.agentId).id) };
      case 'kb.add': return this._dialogs.addKnowledge(m.requireAgent(p.agentId));
      case 'kb.remove': return { documents: m.knowledge.removeDocument(m.requireAgent(p.agentId).id, p.docId) };
      default: throw new Error(`Unknown action: ${action}`);
    }
  }
}

module.exports = AgentSetupInvoke;
