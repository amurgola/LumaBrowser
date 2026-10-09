const ThinkingKnobs = require('../../../llm-server/server/ThinkingKnobs');
const SharedLlmTurn = require('./SharedLlmTurn');
const ResponsesInput = require('./ResponsesInput');
const ResponsesStream = require('./ResponsesStream');
const LlmModelGate = require('./LlmModelGate');

class ResponsesTurn extends SharedLlmTurn {
  async _validate() {
    this._model = this._body.model;
    this._wantStream = this._body.stream === true;
    if (!this._model) return ResponsesTurn._refusal(400, 'model is required');
    const { messages, images } = ResponsesInput.toMessages(this._body);
    if (!messages || messages.length === 0) return ResponsesTurn._refusal(400, 'input is required');
    this._messages = messages;
    this._images = images;
    return await this._modelRefusal() || this._routerRefusal();
  }

  async _modelRefusal() {
    const denied = await LlmModelGate.denied(this._service, this._model);
    return denied ? ResponsesTurn._refusal(403, denied) : null;
  }

  _routerRefusal() {
    this._chatRouter = this._service.getChatRouter();
    if (!this._chatRouter || typeof this._chatRouter.proxyStream !== 'function') return ResponsesTurn._refusal(503, 'host chat is not ready');
    return null;
  }

  _open() {
    this._stream = new ResponsesStream(this._res, { model: this._model, temperature: this._body.temperature });
    this._text = '';
  }

  _beforeDispatch() {
    if (this._wantStream) this._stream.started();
  }

  _startProxy() {
    return this._chatRouter.proxyStream({
      modelRef: this._model,
      messages: this._messages,
      temperature: this._body.temperature,
      hooks: this._hooks(),
      images: this._images,
      extra: ThinkingKnobs.extra(this._body, this._service.hostDialPosition()),
    });
  }

  _hooks() {
    return {
      onDelta: (text) => this._onDelta(text),
      onReasoningDelta: () => {},
      onStatus: () => {},
      onUsage: (usage) => this._meter.setUsage(usage),
      onDone: (summary) => this._complete(summary),
      onError: (err) => this._fail(err),
    };
  }

  _onDelta(text) {
    if (!text) return;
    this._text += text;
    if (this._wantStream) this._stream.delta(text);
  }

  _warnLabel() {
    return 'LLM responses proxy error';
  }

  _completedBody() {
    return this._stream.response('completed', this._text, this._meter.usage());
  }

  _cancelledBody() {
    return this._stream.incompleteResponse(this._text, this._meter.usage());
  }

  _errorBody(message) {
    return { error: { message, type: 'server_error' } };
  }

  _streamCompleted() {
    this._stream.completed(this._text, this._meter.usage());
  }

  _streamCancelled() {
    this._stream.incomplete(this._text, this._meter.usage());
  }

  _streamFailed(message) {
    this._stream.failed(this._text, this._meter.usage(), message);
  }

  static _refusal(status, message) {
    return { status, body: { error: { message } } };
  }
}

module.exports = ResponsesTurn;
