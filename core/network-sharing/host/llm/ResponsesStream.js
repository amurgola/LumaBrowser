const crypto = require('crypto');
const SseChannel = require('./SseChannel');

class ResponsesStream {
  constructor(res, { model, temperature }) {
    this._sse = new SseChannel(res);
    this._model = model;
    this._temperature = typeof temperature === 'number' ? temperature : null;
    this._id = 'resp_' + crypto.randomBytes(8).toString('hex');
    this._messageId = 'msg_' + crypto.randomBytes(8).toString('hex');
    this._created = Math.floor(Date.now() / 1000);
    this._sequence = 0;
    this._itemAdded = false;
  }

  event(type, payload) {
    this._sse.event(type, { type, sequence_number: this._sequence++, ...payload });
  }

  started() {
    this.event('response.created', { response: this.response('in_progress', '', null) });
    this.event('response.in_progress', { response: this.response('in_progress', '', null) });
  }

  delta(text) {
    if (!this._itemAdded) this._openItem();
    this.event('response.output_text.delta', { item_id: this._messageId, output_index: 0, content_index: 0, delta: text });
  }

  completed(text, usage) {
    if (this._itemAdded) this._closeItem(text);
    this.event('response.completed', { response: this.response('completed', text, usage) });
  }

  incomplete(text, usage) {
    this.event('response.incomplete', { response: this.incompleteResponse(text, usage) });
  }

  failed(text, usage, message) {
    this.event('response.failed', { response: { ...this.response('failed', text, usage), error: { code: 'server_error', message } } });
  }

  response(status, text, usage) {
    const completed = status === 'completed';
    return {
      id: this._id,
      object: 'response',
      created_at: this._created,
      status,
      error: null,
      incomplete_details: null,
      model: this._model,
      output: completed ? [this._outputItem(text)] : [],
      output_text: completed ? text : '',
      parallel_tool_calls: false,
      previous_response_id: null,
      store: false,
      temperature: this._temperature,
      tools: [],
      truncation: 'disabled',
      usage: ResponsesStream.mapUsage(usage),
      metadata: {},
    };
  }

  incompleteResponse(text, usage) {
    return { ...this.response('incomplete', text, usage), incomplete_details: { reason: 'cancelled' } };
  }

  static mapUsage(usage) {
    if (!usage) return null;
    return {
      input_tokens: usage.prompt_tokens || 0,
      output_tokens: usage.completion_tokens || 0,
      total_tokens: usage.total_tokens || ((usage.prompt_tokens || 0) + (usage.completion_tokens || 0)),
    };
  }

  _openItem() {
    this._itemAdded = true;
    this.event('response.output_item.added', {
      output_index: 0,
      item: { type: 'message', id: this._messageId, status: 'in_progress', role: 'assistant', content: [] },
    });
    this.event('response.content_part.added', {
      item_id: this._messageId, output_index: 0, content_index: 0,
      part: { type: 'output_text', text: '', annotations: [] },
    });
  }

  _closeItem(text) {
    this.event('response.output_text.done', { item_id: this._messageId, output_index: 0, content_index: 0, text });
    this.event('response.content_part.done', {
      item_id: this._messageId, output_index: 0, content_index: 0,
      part: { type: 'output_text', text, annotations: [] },
    });
    this.event('response.output_item.done', { output_index: 0, item: this._outputItem(text) });
  }

  _outputItem(text) {
    return {
      type: 'message', id: this._messageId, status: 'completed', role: 'assistant',
      content: [{ type: 'output_text', text, annotations: [] }],
    };
  }
}

module.exports = ResponsesStream;
