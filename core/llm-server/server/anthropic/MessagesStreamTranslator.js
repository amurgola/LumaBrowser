const AnthropicIds = require('./AnthropicIds');
const MessagesResponseTranslator = require('./MessagesResponseTranslator');
const StopReason = require('./StopReason');

class MessagesStreamTranslator {
  constructor({ modelId, emit }) {
    this._modelId = modelId;
    this._emit = emit;
    this._started = false;
    this._done = false;
    this._nextIndex = 0;
    this._open = null;
    this._toolBlocks = new Map();
    this._finish = null;
    this._usage = MessagesResponseTranslator.usage(null);
  }

  chunk(chunk) {
    if (this._done || !chunk || typeof chunk !== 'object') return;
    this._start(chunk.id);
    this._recordUsage(chunk.usage);
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
    this._emitFinish();
  }

  error(message) {
    if (this._done) return;
    this._done = true;
    this._emit('error', { type: 'error', error: { type: 'api_error', message } });
  }

  _start(upstreamId) {
    if (this._started) return;
    this._started = true;
    this._emit('message_start', { type: 'message_start', message: this._emptyMessage(upstreamId) });
    this._emit('ping', { type: 'ping' });
  }

  _emptyMessage(upstreamId) {
    return {
      id: AnthropicIds.messageId(upstreamId),
      type: 'message', role: 'assistant', model: this._modelId, content: [],
      stop_reason: null, stop_sequence: null,
      usage: { input_tokens: 0, output_tokens: 0 },
    };
  }

  _recordUsage(usage) {
    if (usage && typeof usage === 'object') this._usage = MessagesResponseTranslator.usage(usage);
  }

  _translateDelta(delta) {
    if (typeof delta.reasoning_content === 'string' && delta.reasoning_content) {
      this._appendTo('thinking', { type: 'thinking', thinking: '', signature: '' }, { type: 'thinking_delta', thinking: delta.reasoning_content });
    }
    if (typeof delta.content === 'string' && delta.content) {
      this._appendTo('text', { type: 'text', text: '' }, { type: 'text_delta', text: delta.content });
    }
    if (Array.isArray(delta.tool_calls)) {
      for (const call of delta.tool_calls) this._translateToolCall(call);
    }
  }

  _appendTo(kind, emptyBlock, delta) {
    if (!this._open || this._open.kind !== kind) this._openBlock(kind, emptyBlock);
    this._emitDelta(this._open.index, delta);
  }

  _translateToolCall(call) {
    if (!call || typeof call !== 'object') return;
    const key = Number.isInteger(call.index) ? call.index : this._toolBlocks.size;
    let index = this._toolBlocks.get(key);
    if (index === undefined) index = this._openTool(key, call);
    const args = call.function && call.function.arguments;
    if (typeof args === 'string' && args && this._open && this._open.index === index) {
      this._emitDelta(index, { type: 'input_json_delta', partial_json: args });
    }
  }

  _openTool(key, call) {
    const index = this._openBlock('tool', {
      type: 'tool_use',
      id: String(call.id || AnthropicIds.toolUseId()),
      name: String((call.function && call.function.name) || ''),
      input: {},
    });
    this._open.toolKey = key;
    this._toolBlocks.set(key, index);
    return index;
  }

  _openBlock(kind, block) {
    this._close();
    const index = this._nextIndex++;
    this._open = { kind, index };
    this._emit('content_block_start', { type: 'content_block_start', index, content_block: block });
    return index;
  }

  _close() {
    if (!this._open) return;
    this._emit('content_block_stop', { type: 'content_block_stop', index: this._open.index });
    this._open = null;
  }

  _emitDelta(index, delta) {
    this._emit('content_block_delta', { type: 'content_block_delta', index, delta });
  }

  _emitFinish() {
    this._emit('message_delta', {
      type: 'message_delta',
      delta: { stop_reason: StopReason.forReply(this._finish, this._toolBlocks.size > 0), stop_sequence: null },
      usage: { output_tokens: this._usage.output_tokens, input_tokens: this._usage.input_tokens },
    });
    this._emit('message_stop', { type: 'message_stop' });
  }
}

module.exports = MessagesStreamTranslator;
