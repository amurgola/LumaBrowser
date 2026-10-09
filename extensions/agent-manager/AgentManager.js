const AgentStore = require('./AgentStore');
const AgentKnowledgeBase = require('./AgentKnowledgeBase');
const KnowledgeBaseTransfer = require('./KnowledgeBaseTransfer');
const AgentChatMode = require('./AgentChatMode');
const AgentBundle = require('./AgentBundle');
const AgentRuntime = require('./AgentRuntime');

class AgentManager {
  constructor(context, { knowledge = new AgentKnowledgeBase(), runtime = new AgentRuntime() } = {}) {
    this.store = new AgentStore(context.db.getRawDb());
    this.knowledge = knowledge;
    this.transfer = new KnowledgeBaseTransfer(knowledge);
    this.runtime = runtime;
    this.chatMode = new AgentChatMode({ chat: context.chat || null, store: this.store, knowledge });
    this.bundles = new AgentBundle(this);
  }

  createAgent(input) {
    const agent = this.store.create(input || {});
    this.chatMode.sync();
    return agent;
  }

  deleteAgent(id) {
    this.knowledge.purge(id);
    const removed = this.store.delete(id);
    this.chatMode.sync();
    return removed;
  }

  requireAgent(idOrName) {
    const agent = this.store.get(idOrName);
    if (!agent) throw new Error('Agent not found');
    return agent;
  }

  listWithKnowledge() {
    return this.store.list().map((a) => ({ ...a, kbDocs: this.knowledge.count(a.id) }));
  }

  api() {
    return {
      getStore: () => this.store,
      runTurn: (opts) => this.runtime.runTurn(opts),
      createAgent: (input) => this.createAgent(input),
      deleteAgent: (id) => this.deleteAgent(id),
      exportAgentBundle: (id) => this.bundles.export(this.requireAgent(id)),
      importAgentBundle: (bundle) => this.bundles.import(bundle),
    };
  }

  publicSurface(chatUiPath) {
    return {
      listAgents: () => this.store.list().map((a) => ({
        id: a.id, name: a.name, description: a.description || '', kbDocs: this.knowledge.count(a.id),
      })),
      buildTurn: (agentId) => {
        const agent = agentId ? this.store.get(agentId) : null;
        return agent ? this.chatMode.buildTurn({ data: { agentId: agent.id } }) : null;
      },
      chatUiPath,
    };
  }
}

module.exports = AgentManager;
