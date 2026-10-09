const AgentKnowledgeGrant = require('./AgentKnowledgeGrant');
const AgentModels = require('./AgentModels');

class AgentChatMode {
  static MODE_ID = 'agent-chat';
  static DELETED_PROMPT = 'The custom agent this conversation was created for has been deleted. '
    + 'Tell the user that and suggest starting a new chat (or recreating the agent in Setup → Agents).';

  constructor({ chat, store, knowledge }) {
    this._chat = chat;
    this._store = store;
    this._knowledge = knowledge;
  }

  buildTurn(meta) {
    const data = (meta && meta.data) || {};
    const agent = data.agentId ? this._store.get(data.agentId) : null;
    if (!agent) return { systemPrompt: AgentChatMode.DELETED_PROMPT };
    const { kbScope, allowedTools, modeSystemPrompt } = AgentKnowledgeGrant.forTurn(agent, this._knowledge.ragService());
    const turn = { systemPrompt: modeSystemPrompt || null, agent: allowedTools.length > 0, kbScope };
    if (allowedTools.length) turn.allowedTools = allowedTools;
    if (agent.modelRef && AgentModels.isInstalled(agent.modelRef)) turn.modelRef = agent.modelRef;
    return turn;
  }

  sync() {
    if (!this._chat) return;
    if (this._store.list().length) {
      this._chat.registerMode(this._descriptor());
      return;
    }
    try { this._chat.unregisterMode(AgentChatMode.MODE_ID); } catch (_) {}
  }

  _descriptor() {
    return {
      id: AgentChatMode.MODE_ID,
      label: 'Chat with agent',
      description: 'Talk directly to one of your custom agents. Its instructions, tools, knowledge base, and model take over the conversation.',
      requirements: ['llm'],
      launcher: 'sidebar',
      chatUiUrl: this._chat.uiUrl('chat-ui.js'),
      buildTurn: ({ meta }) => this.buildTurn(meta),
    };
  }
}

module.exports = AgentChatMode;
