const crypto = require('crypto');
const SseChannel = require('./SseChannel');

class ChatCompletionStream {
  constructor(res, { model, wantStream }) {
    this._sse = new SseChannel(res);
    this._model = model;
    this._wantStream = wantStream;
    this._id = 'chatcmpl-' + crypto.randomBytes(8).toString('hex');
    this._created = Math.floor(Date.now() / 1000);
  }

  chunk(delta, finish = null) {
    this._sse.data({ ...this._header('chat.completion.chunk'), choices: [{ index: 0, delta: delta || {}, finish_reason: finish || null }] });
  }

  usage(usage) {
    if (!usage) return;
    this._sse.data({ ...this._header('chat.completion.chunk'), choices: [], usage });
  }

  event(event, payload) {
    if (!this._wantStream) return;
    this._sse.data({ object: 'luma.event', event, payload: payload || {} });
  }

  finish(finishReason, usage) {
    this.usage(usage);
    this.chunk({}, finishReason);
    this._sse.done();
  }

  completion(content, finishReason, usage) {
    return {
      ...this._header('chat.completion'),
      choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: finishReason }],
      usage: usage || undefined,
    };
  }

  _header(object) {
    return { id: this._id, object, created: this._created, model: this._model };
  }
}

module.exports = ChatCompletionStream;
