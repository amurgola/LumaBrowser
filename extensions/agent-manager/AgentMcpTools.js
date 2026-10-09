const AgentKnowledgeBase = require('./AgentKnowledgeBase');
const AgentRuntime = require('./AgentRuntime');
const ArtifactBubbler = require('./ArtifactBubbler');

class AgentMcpTools {
  static TOOLS = [
    {
      name: 'list_agents',
      description:
        'List the user-defined sub-agents available to delegate work to. Returns '
        + 'each agent\'s name, description, and (when it has one) the size of its '
        + 'private knowledge base; prefer an agent with knowledgeBaseDocs for '
        + 'questions its documents likely cover. ALWAYS call this first when a task '
        + 'might be better handled by a specialised agent (research, coding, etc.) '
        + 'so you can pick the best fit, then call chat_with_agent.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'chat_with_agent',
      description:
        'Delegate a task to one of the user-defined agents (see list_agents) and '
        + 'get its full response. The agent is a focused micro-LLM with its own '
        + 'system prompt + tools; pass it only the relevant context for the task. '
        + 'Use this when a listed agent is better suited than answering yourself.',
      inputSchema: {
        type: 'object',
        properties: {
          agentName: { type: 'string', description: 'Name of the agent to delegate to (from list_agents).' },
          message: { type: 'string', description: 'The task / message to send the agent. Include all context it needs.' },
          images: {
            type: 'array',
            description: 'Optional images to pass the agent: [{ name, mime, base64 }]. Only if the agent should see them.',
          },
        },
        required: ['agentName', 'message'],
      },
    },
  ];

  static FILES_NOTE = 'The listed artifacts are files the agent created. They are ALREADY shown to the user '
    + 'in this conversation and fully usable here: refer to them by title, and pass an id to '
    + 'edit_artifact / edit_image to change one. Do NOT tell the user the file is elsewhere or unavailable.';

  constructor({ store = null, runtime = new AgentRuntime(), knowledge = new AgentKnowledgeBase() } = {}) {
    this._store = store;
    this._runtime = runtime;
    this._knowledge = knowledge;
  }

  setStore(store) {
    this._store = store;
  }

  async handle(toolName, args, opts) {
    if (toolName === 'list_agents') return AgentMcpTools._json({ success: true, agents: this._listAgents() });
    if (toolName === 'chat_with_agent') return this._chatWithAgent(args || {}, opts || {});
    return AgentMcpTools._error(`Unknown tool: ${toolName}`);
  }

  _listAgents() {
    return (this._store ? this._store.list() : []).map((a) => {
      const out = { name: a.name, description: a.description || '' };
      const docs = this._knowledge.count(a.id);
      if (docs > 0) out.knowledgeBaseDocs = docs;
      return out;
    });
  }

  async _chatWithAgent(args, opts) {
    const name = args.agentName || args.agent || args.name;
    const message = args.message || args.prompt || args.task;
    if (!name) return AgentMcpTools._error('chat_with_agent requires "agentName".');
    if (!message) return AgentMcpTools._error('chat_with_agent requires "message".');
    const agent = this._store && this._store.get(name);
    if (!agent) return AgentMcpTools._error(`No agent named "${name}". Call list_agents to see what's available.`);
    return this._delegate(agent, message, args, opts);
  }

  async _delegate(agent, message, args, opts) {
    const emit = typeof opts.emit === 'function' ? opts.emit : null;
    const invocationId = 'inv-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    if (emit) emit({ phase: 'start', invocationId, agentName: agent.name });
    const bubbler = new ArtifactBubbler(opts.chat);
    const { text, error } = await this._runtime.runTurn({
      agent,
      messages: [{ role: 'user', content: String(message) }],
      images: Array.isArray(args.images) ? args.images : [],
      emit: (p) => AgentMcpTools._forward(p, { emit, bubbler, invocationId, agentName: agent.name }),
    });
    if (emit) emit({ phase: error ? 'error' : 'done', invocationId, agentName: agent.name, message: error || undefined });
    if (error) return AgentMcpTools._error(`Agent "${agent.name}" failed: ${error}`);
    return AgentMcpTools._json(AgentMcpTools._answer(agent, text, bubbler.summaries()));
  }

  static _forward(p, { emit, bubbler, invocationId, agentName }) {
    if (p && p.phase === 'artifact') {
      bubbler.bubble(p.artifact);
      return;
    }
    if (emit) emit({ ...p, invocationId, agentName });
  }

  static _answer(agent, text, artifacts) {
    const out = { success: true, agent: agent.name, response: text };
    if (artifacts.length) {
      out.artifacts = artifacts;
      out.note = AgentMcpTools.FILES_NOTE;
    }
    return out;
  }

  static _json(obj) {
    return { content: [{ type: 'text', text: JSON.stringify(obj) }] };
  }

  static _error(msg) {
    return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: msg }) }], isError: true };
  }
}

module.exports = AgentMcpTools;
