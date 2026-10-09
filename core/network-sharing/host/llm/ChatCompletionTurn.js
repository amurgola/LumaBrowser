const ThinkingKnobs = require('../../../llm-server/server/ThinkingKnobs');
const SharedLlmTurn = require('./SharedLlmTurn');
const ChatTurnInputs = require('./ChatTurnInputs');
const ChatCompletionStream = require('./ChatCompletionStream');
const LlmModelGate = require('./LlmModelGate');

class ChatCompletionTurn extends SharedLlmTurn {
  constructor(service, turns, agents) {
    super(service, turns);
    this._agents = agents;
  }

  async _validate() {
    const agent = this._resolveAgent();
    if (agent.refusal) return agent.refusal;
    this._resolveInputs(agent.turn || null);
    return this._requestRefusal() || await this._modelRefusal() || this._routerRefusal();
  }

  _resolveAgent() {
    return this._body.agentId != null ? this._agents.resolveTurn(this._body.agentId) : {};
  }

  _resolveInputs(agentTurn) {
    const body = this._body;
    this._agentTurn = agentTurn;
    this._model = body.model;
    this._effectiveModel = (agentTurn && agentTurn.modelRef) || body.model;
    this._wantStream = body.stream !== false;
    this._wantAgent = ChatTurnInputs.wantsAgent(body, agentTurn);
    this._images = ChatTurnInputs.images(body.attachments);
    this._priorArtifacts = Array.isArray(body.priorArtifacts) ? body.priorArtifacts : [];
    this._extra = ThinkingKnobs.extra(body, this._service.hostDialPosition());
  }

  _requestRefusal() {
    if (!Array.isArray(this._body.messages) || this._body.messages.length === 0) return ChatCompletionTurn._refusal(400, 'messages is required');
    if (!this._model) return ChatCompletionTurn._refusal(400, 'model is required');
    return null;
  }

  async _modelRefusal() {
    const denied = await LlmModelGate.denied(this._service, this._model);
    return denied ? ChatCompletionTurn._refusal(403, denied) : null;
  }

  _routerRefusal() {
    this._chatRouter = this._service.getChatRouter();
    if (!this._chatRouter || typeof this._chatRouter.proxyStream !== 'function') return ChatCompletionTurn._refusal(503, 'host chat is not ready');
    if (this._wantAgent && typeof this._chatRouter.proxyAgent !== 'function') return ChatCompletionTurn._refusal(503, 'host agent tools are not available');
    return null;
  }

  _open() {
    this._stream = new ChatCompletionStream(this._res, { model: this._model, wantStream: this._wantStream });
    this._content = '';
  }

  async _startProxy() {
    const hooks = this._hooks();
    const common = { modelRef: this._effectiveModel, temperature: this._body.temperature, hooks, images: this._images, extra: this._extra };
    if (!this._wantAgent) {
      return this._chatRouter.proxyStream({ ...common, messages: ChatTurnInputs.streamMessages(this._agentTurn, false, this._body.messages) });
    }
    return this._chatRouter.proxyAgent({
      ...common,
      messages: this._body.messages,
      priorArtifacts: this._priorArtifacts,
      allowedTools: ChatTurnInputs.allowedTools(this._agentTurn, this._service.getWebAllowedTools()),
      modeSystemPrompt: this._agentTurn ? this._agentTurn.systemPrompt : null,
      kbScope: this._agentTurn ? this._agentTurn.kbScope : null,
    });
  }

  _hooks() {
    return {
      onDelta: (text) => this._onDelta(text),
      onReasoningDelta: (text) => { if (text && this._wantStream) this._stream.chunk({ reasoning_content: text }); },
      onUsage: (usage) => this._meter.setUsage(usage),
      onStatus: (payload) => this._stream.event('status', payload),
      onToolEvent: (payload) => this._stream.event('tool', payload),
      onArtifact: (artifact) => {
        this._meter.countArtifact(artifact);
        this._stream.event('artifact', artifact);
      },
      onArtifactStream: (payload) => this._stream.event('artifact-stream', payload),
      onAgentEvent: (payload) => this._onAgentEvent(payload),
      onContentRollback: (chars) => this._onRollback(chars),
      onDone: (summary) => this._complete(summary),
      onError: (err) => this._fail(err),
    };
  }

  _onDelta(text) {
    if (!text) return;
    this._content += text;
    if (this._wantStream) this._stream.chunk({ content: text });
  }

  _onAgentEvent(payload) {
    if (payload && typeof payload.type === 'string') this._stream.event(payload.type, payload.payload !== undefined ? payload.payload : payload);
    else this._stream.event('agent', payload);
  }

  _onRollback(chars) {
    const count = Math.max(0, Math.min(chars || 0, this._content.length));
    this._content = this._content.slice(0, this._content.length - count);
    this._stream.event('rollback', { chars: count });
  }

  _completedBody(summary) {
    return this._stream.completion(this._content, ChatCompletionTurn._finishReason(summary), this._meter.usage());
  }

  _cancelledBody() {
    return this._stream.completion(this._content, 'stop', this._meter.usage());
  }

  _errorBody(message) {
    return { error: { message } };
  }

  _streamCompleted(summary) {
    this._stream.finish(ChatCompletionTurn._finishReason(summary), this._meter.usage());
  }

  _streamCancelled() {
    this._stream.finish('stop', null);
  }

  _streamFailed() {
    this._stream.finish('stop', null);
  }

  static _finishReason(summary) {
    return (summary && summary.finishReason) || 'stop';
  }

  static _refusal(status, message) {
    return { status, body: { error: { message } } };
  }
}

module.exports = ChatCompletionTurn;
