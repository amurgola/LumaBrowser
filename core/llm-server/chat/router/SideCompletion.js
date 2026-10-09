const ThinkingOff = require('../../../llm-service/ThinkingOff');
const MessageImages = require('./MessageImages');
const TransientLlmError = require('./TransientLlmError');
const CollectedCompletion = require('./CollectedCompletion');

class SideCompletion {
  static ATTEMPTS = 3;
  static RETRY_DELAY_MS = 300;
  static DEFAULT_TRACE = { conversationId: null, callType: 'side' };

  constructor({ dispatch, models }) {
    this._dispatch = dispatch;
    this._models = models;
    this._collected = new CollectedCompletion(dispatch);
  }

  async complete({ messages, temperature = 0.2, modelRef, timeoutMs = 30000, noThink = false, images = [], trace = null } = {}) {
    if (!Array.isArray(messages) || messages.length === 0) return { error: 'messages is required' };
    const ref = this._models.resolveRef(modelRef);
    if (!ref) return { error: 'No model configured.' };
    const off = noThink ? ThinkingOff.resolve(ref, messages) : null;
    const tag = trace || SideCompletion.DEFAULT_TRACE;
    return this._withRetries({
      modelRef: ref,
      messages: off ? off.messages : messages,
      temperature,
      images: MessageImages.imagesOf(images),
      extra: off ? { ...(off.extra || {}), trace: tag } : { trace: tag },
      timeoutMs,
      timeoutMessage: 'complete timeout',
    });
  }

  completeStream({ messages, temperature = 0.9, modelRef, timeoutMs = 300000, noThink = false } = {}, ext = {}) {
    if (!Array.isArray(messages) || messages.length === 0) return SideCompletion._failed(ext, 'messages is required');
    const ref = this._models.resolveRef(modelRef);
    if (!ref) return SideCompletion._failed(ext, 'No model configured.');
    const off = noThink ? ThinkingOff.resolve(ref, messages) : null;
    return this._stream(ref, off ? off.messages : messages, temperature, off ? off.extra : null, timeoutMs, ext);
  }

  async _withRetries(request) {
    let lastErr = null;
    for (let attempt = 0; attempt < SideCompletion.ATTEMPTS; attempt += 1) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, SideCompletion.RETRY_DELAY_MS));
      try {
        return { text: await this._collected.run(request) };
      } catch (err) {
        lastErr = err;
        if (!TransientLlmError.matches(err)) break;
      }
    }
    return { error: (lastErr && lastErr.message) || 'complete failed' };
  }

  _stream(ref, messages, temperature, extra, timeoutMs, ext) {
    const s = { text: '', done: false, aborted: false, handle: null, timer: null };
    const stop = () => { try { if (s.handle && s.handle.abort) s.handle.abort(); } catch (_) {} };
    const finishDone = () => {
      if (s.done) return;
      s.done = true; clearTimeout(s.timer);
      SideCompletion._call(ext.onDone, s.text);
    };
    const finishErr = (e) => {
      if (s.done) return;
      s.done = true; clearTimeout(s.timer); stop();
      SideCompletion._call(ext.onError, e instanceof Error ? e : new Error(String(e)));
    };
    s.timer = setTimeout(() => { stop(); finishErr(new Error('complete timeout')); }, timeoutMs);
    this._startStream(ref, messages, temperature, extra, SideCompletion._streamHooks(s, ext, finishDone, finishErr)).then(
      (h) => { s.handle = h; if (s.aborted || s.done) stop(); },
      (e) => finishErr(e),
    );
    return { abort: () => { s.aborted = true; stop(); finishDone(); } };
  }

  _startStream(ref, messages, temperature, extra, hooks) {
    try {
      return Promise.resolve(this._dispatch(ref, messages, temperature, hooks, [], null, extra));
    } catch (err) {
      return Promise.reject(err);
    }
  }

  static _streamHooks(s, ext, finishDone, finishErr) {
    return {
      onDelta: (t) => {
        if (!t || s.done) return;
        s.text += t;
        SideCompletion._call(ext.onDelta, t);
      },
      onReasoningDelta: (t) => {
        if (!t || s.done) return;
        SideCompletion._call(ext.onReasoning, t);
      },
      onUsage: () => {},
      onStatus: () => {},
      onDone: finishDone,
      onError: finishErr,
    };
  }

  static _failed(ext, message) {
    SideCompletion._call(ext.onError, new Error(message));
    return { abort: () => {} };
  }

  static _call(fn, value) {
    if (!fn) return;
    try { fn(value); } catch (_) {}
  }
}

module.exports = SideCompletion;
