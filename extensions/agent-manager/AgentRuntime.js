const ExtensionGlobals = require('../../core/shell/extensions/ExtensionGlobals');
const AgentKnowledgeGrant = require('./AgentKnowledgeGrant');
const AgentRunSink = require('./AgentRunSink');

class AgentRuntime {
  static TEMPERATURE = 0.4;

  constructor({ getRouter = () => ExtensionGlobals.chatRouter(), Bridge = null } = {}) {
    this._getRouter = getRouter;
    this._Bridge = Bridge;
  }

  async runTurn({ agent, messages, images, emit, signal } = {}) {
    if (!agent) return AgentRuntime._failure('No agent supplied');
    const router = this._getRouter();
    if (!router) return AgentRuntime._failure('LLM chat router is not available yet');
    const deps = (typeof router.getAgentDeps === 'function' && router.getAgentDeps()) || {};
    const modelRef = agent.modelRef || AgentRuntime._defaultModel(router);
    if (!modelRef) return AgentRuntime._failure('No model is configured for this agent');
    const sink = new AgentRunSink(emit);
    let handle;
    try {
      handle = this._bridgeFor(router).run(AgentRuntime._runOptions({ agent, messages, images, deps, modelRef, hooks: sink.hooks }));
    } catch (err) {
      return AgentRuntime._failure((err && err.message) || 'agent run failed to start');
    }
    AgentRuntime._wireAbort(signal, handle);
    try { await handle.done; } catch (err) { sink.fail((err && err.message) || 'agent run failed'); }
    return sink.result();
  }

  static _runOptions({ agent, messages, images, deps, modelRef, hooks }) {
    const { kbScope, allowedTools, modeSystemPrompt } = AgentKnowledgeGrant.forTurn(agent, deps.ragService);
    const stamp = Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    return {
      modelRef,
      messages: Array.isArray(messages) ? messages : [],
      temperature: AgentRuntime.TEMPERATURE,
      conversationId: 'agent:' + agent.id + ':' + stamp,
      assistantMessageId: 'agentmsg:' + stamp,
      deps,
      hooks,
      priorMessages: [],
      modeSystemPrompt,
      images: Array.isArray(images) ? images : [],
      allowedTools,
      kbScope,
    };
  }

  _bridgeFor(router) {
    const Bridge = this._Bridge || require('../../core/llm-server/chat/AgentChatBridge');
    return new Bridge({ router });
  }

  static _wireAbort(signal, handle) {
    if (!signal) return;
    const abort = () => { try { handle.abort(); } catch (_) {} };
    if (signal.aborted) abort();
    else if (typeof signal.addEventListener === 'function') signal.addEventListener('abort', abort, { once: true });
  }

  static _defaultModel(router) {
    try { return router.listModels().defaultRef || null; } catch (_) { return null; }
  }

  static _failure(error) {
    return { text: '', error, artifacts: [] };
  }
}

module.exports = AgentRuntime;
