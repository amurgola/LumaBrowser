const ChatModelRef = require('./ChatModelRef');
const GuestTurnDispatch = require('./GuestTurnDispatch');
const ChatStyleDocs = require('./ChatStyleDocs');
const ChatTurn = require('./ChatTurn');
const MessageImages = require('./MessageImages');

class ProxyTurns {
  constructor({ llmServerService, dispatch, agentBridge, getAgentDeps, reclaimer, contextWindow, plainPrompt = null }) {
    this._service = llmServerService;
    this._dispatch = dispatch;
    this._reclaimer = reclaimer;
    this._plainPrompt = plainPrompt;
    this._guest = new GuestTurnDispatch({ agentBridge, getAgentDeps, contextWindow });
  }

  async stream({ modelRef, messages, temperature, hooks, images = [], extra = null, chatStyle = null }) {
    const ref = this.resolveRef(modelRef);
    const sent = chatStyle ? ChatStyleDocs.plainTurn(messages, { plainPrompt: this._plainPrompt, ...chatStyle }) : messages;
    const turn = MessageImages.lift(sent);
    const handle = await this._dispatch(ref, turn.messages, temperature, hooks, [...images, ...turn.images], null,
      { ...(extra || {}), trace: { conversationId: null, callType: ProxyTurns._callType(extra) } });
    return this.wrapHandle(ref, handle);
  }

  static _callType(extra) {
    return (extra && extra.clientCallType) || 'sharing';
  }

  agent({ modelRef, messages, temperature, hooks, images = [], priorArtifacts = [], allowedTools = null, extra = null,
    modeSystemPrompt = null, kbScope = null, clientConversationId = null, plan = null, mediaModels = null, choicesOn = false,
    voiceOn = false }) {
    const ref = this.resolveRef(modelRef);
    return this.wrapHandle(ref, this._guest.run({
      modelRef: ref,
      messages,
      temperature,
      hooks,
      images,
      priorMessages: ProxyTurns._priorMessages(priorArtifacts),
      allowedTools,
      extra,
      modeSystemPrompt,
      kbScope,
      runId: ProxyTurns._ephemeralId(),
      clientConversationId,
      plan,
      mediaModels,
      choicesOn,
      voiceOn,
      modelBudget: this._modelBudget(ref),
    }));
  }

  _modelBudget(ref) {
    try {
      const settings = this._service && this._service.modelSettings;
      return settings ? ChatTurn._modelBudget(settings.resolve(ref).settings) : null;
    } catch (_) {
      return null;
    }
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
