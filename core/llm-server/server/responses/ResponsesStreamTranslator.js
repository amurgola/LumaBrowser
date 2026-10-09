const ResponseEnvelope = require('./ResponseEnvelope');
const ResponsesError = require('./ResponsesError');
const ResponsesIds = require('./ResponsesIds');
const StreamedMessageItem = require('./StreamedMessageItem');
const StreamedReasoningItem = require('./StreamedReasoningItem');
const StreamedToolCallItem = require('./StreamedToolCallItem');

class ResponsesStreamTranslator {
  static TEXT_ITEMS = { reasoning: StreamedReasoningItem, message: StreamedMessageItem };

  constructor({ modelId, context = {}, emit }) {
    this._modelId = modelId;
    this._context = context || {};
    this._emitRaw = emit;
    this._sequence = 0;
    this._envelope = null;
    this._done = false;
    this._open = null;
    this._output = [];
    this._nextIndex = 0;
    this._tools = new Map();
    this._finish = null;
    this._usage = null;
  }

  chunk(chunk) {
    if (this._done || !chunk || typeof chunk !== 'object') return;
    this._start(chunk.id);
    if (chunk.usage && typeof chunk.usage === 'object') this._usage = chunk.usage;
    const choice = Array.isArray(chunk.choices) ? chunk.choices[0] : null;
    if (!choice) return;
    this._translateDelta(choice.delta || {});
    if (choice.finish_reason) this._finish = choice.finish_reason;
  }

  end() {
    if (this._done) return;
    this._done = true;
    this._start(null);
    this._close();
    const response = this._envelope.finished({ output: this._output, usage: this._usage, finishReason: this._finish });
    this._emit(response.status === 'incomplete' ? 'response.incomplete' : 'response.completed', { response });
  }

  error(message) {
    if (this._done) return;
    this._done = true;
    this._start(null);
    this._emit('response.failed', { response: this._envelope.failed({ output: this._output, error: ResponsesError.failure(message) }) });
  }

  _start(upstreamId) {
    if (this._envelope) return;
    this._envelope = new ResponseEnvelope({ id: ResponsesIds.responseId(upstreamId), modelId: this._modelId, echo: this._context.echo });
    this._emit('response.created', { response: this._envelope.inProgress() });
    this._emit('response.in_progress', { response: this._envelope.inProgress() });
  }

  _translateDelta(delta) {
    if (typeof delta.reasoning_content === 'string' && delta.reasoning_content) this._appendText('reasoning', delta.reasoning_content);
    if (typeof delta.content === 'string' && delta.content) this._appendText('message', delta.content);
    if (Array.isArray(delta.tool_calls)) {
      for (const call of delta.tool_calls) this._translateToolCall(call);
    }
  }

  _appendText(kind, fragment) {
    if (!this._open || this._open.kind !== kind) this._openItem(kind, ResponsesStreamTranslator.TEXT_ITEMS[kind], {});
    this._open.item.append(fragment);
  }

  _translateToolCall(call) {
    if (!call || typeof call !== 'object') return;
    const key = Number.isInteger(call.index) ? call.index : this._tools.size;
    let item = this._tools.get(key);
    if (!item) {
      item = this._openItem('tool', StreamedToolCallItem, { call, customTools: this._context.customTools });
      this._tools.set(key, item);
    }
    const args = call.function && call.function.arguments;
    if (typeof args === 'string' && args && this._open && this._open.item === item) item.append(args);
  }

  _openItem(kind, ItemClass, options) {
    this._close();
    const item = new ItemClass({ ...options, outputIndex: this._nextIndex++, emit: (type, payload) => this._emit(type, payload) });
    this._open = { kind, item };
    item.open();
    return item;
  }

  _close() {
    if (!this._open) return;
    this._output.push(this._open.item.close());
    this._open = null;
  }

  _emit(type, payload) {
    this._emitRaw(type, { type, sequence_number: this._sequence++, ...payload });
  }
}

module.exports = ResponsesStreamTranslator;
