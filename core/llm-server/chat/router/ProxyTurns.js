const ChatModelRef = require('./ChatModelRef');
const AgentTurnDispatch = require('./AgentTurnDispatch');

class ProxyTurns {
  constructor({ llmServerService, dispatch, agentBridge, getAgentDeps, reclaimer }) {
    this._service = llmServerService;
    this._dispatch = dispatch;
    this._bridge = agentBridge;
    this._getAgentDeps = getAgentDeps;
    this._reclaimer = reclaimer;
  }

  async stream({ modelRef, messages, temperature, hooks, images = [], extra = null }) {
    const ref = this.resolveRef(modelRef);
    const handle = await this._dispatch(ref, messages, temperature, hooks, images, null,
      { ...(extra || {}), trace: { conversationId: null, callType: 'sharing' } });
    return this.wrapHandle(ref, handle);
  }

  agent({ modelRef, messages, temperature, hooks, images = [], priorArtifacts = [], allowedTools = null, extra = null,
    modeSystemPrompt = null, kbScope = null }) {
    const ref = this.resolveRef(modelRef);
    const deps = AgentTurnDispatch.requireDeps(this._getAgentDeps);
    return this.wrapHandle(ref, this._bridge.run({
      modelRef: ref,
      messages,
      temperature,
      conversationId: ProxyTurns._ephemeralId(),
      assistantMessageId: ProxyTurns._ephemeralId(),
      deps,
      hooks,
      priorMessages: ProxyTurns._priorMessages(priorArtifacts),
      images,
      allowedTools,
      llmExtra: extra,
      modeSystemPrompt,
      kbScope,
    }));
  }

  resolveRef(modelRef) {
    if (!ChatModelRef.isLocal(modelRef)) return modelRef;
    const entry = this._service.computeLocalProviderEntry ? this._service.computeLocalProviderEntry() : null;
    if (!entry || !entry.selectedModel) throw new Error('No local model is configured on the host.');
    return ChatModelRef.localName(modelRef) ? modelRef : ChatModelRef.LOCAL_PREFIX + entry.selectedModel;
  }

  wrapHandle(ref, handle) {
    const isLocal = ChatModelRef.isLocal(ref);
    let aborted = false;
    return {
      ...(handle || {}),
      abort: () => {
        if (aborted) return;
        aborted = true;
        try { if (handle && handle.abort) handle.abort(); } catch (_) {}
        if (isLocal) this._reclaimer.reclaim();
      },
    };
  }

  static _priorMessages(priorArtifacts) {
    if (!Array.isArray(priorArtifacts) || !priorArtifacts.length) return [];
    return [{ role: 'assistant', content: '', toolCalls: { artifacts: priorArtifacts } }];
  }

  static _ephemeralId() {
    return `web_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

module.exports = ProxyTurns;
