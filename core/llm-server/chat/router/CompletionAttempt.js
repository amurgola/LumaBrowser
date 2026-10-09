const HarmonyToolFence = require('../HarmonyToolFence');

class CompletionAttempt {
  constructor({ dispatch, nativeTools, stallTimeoutMs, ctl, sinks }) {
    this._dispatch = dispatch;
    this._nativeTools = nativeTools;
    this._stallMs = stallTimeoutMs;
    this._ctl = ctl;
    this._sinks = sinks;
    this._timer = null;
    this._handle = null;
    this._done = false;
    this._text = '';
    this._reasoning = '';
    this._resolve = null;
  }

  run(modelRef, messages, temperature, images, tools, extra) {
    return new Promise((resolve) => {
      this._resolve = resolve;
      this._bump();
      this._start(modelRef, messages, temperature, images, tools, extra).then(
        (handle) => this._adopt(handle),
        (e) => this._finish({ success: false, error: (e && e.message) || 'completion failed' }),
      );
    });
  }

  _start(modelRef, messages, temperature, images, tools, extra) {
    try {
      return Promise.resolve(this._dispatch(modelRef, messages, temperature, this._hooks(), images, tools, extra));
    } catch (err) {
      return Promise.reject(err);
    }
  }

  _hooks() {
    return {
      onDelta: (t) => {
        if (!t || this._done) return;
        this._bump();
        this._text += t;
        CompletionAttempt._call(this._sinks.onToken, t);
      },
      onReasoningDelta: (t) => {
        if (!t || this._done) return;
        this._bump();
        this._reasoning += t;
        CompletionAttempt._call(this._sinks.onReasoningToken, t);
      },
      onUsage: (u) => {
        if (!u) return;
        this._bump();
        CompletionAttempt._call(this._sinks.onUsage, u);
      },
      onStatus: (p) => { this._bump(); CompletionAttempt._call(this._sinks.onStatus, p); },
      onDone: (summary) => this._finish(this._result(summary)),
      onError: (e) => this._finish({ success: false, error: (e && e.message) || String(e) || 'completion failed' }),
    };
  }

  _result(summary) {
    if (summary && summary.usage) CompletionAttempt._call(this._sinks.onUsage, summary.usage);
    if (summary && summary.timings) CompletionAttempt._call(this._sinks.onTimings, summary.timings);
    return {
      success: true,
      response: { choices: [{ message: { content: this._content(summary), reasoning_content: this._reasoning || undefined } }] },
      stopReason: (summary && summary.stopReason) || null,
      finishReason: (summary && summary.finishReason) || null,
    };
  }

  _content(summary) {
    if (!(this._nativeTools && summary && Array.isArray(summary.toolCalls) && summary.toolCalls.length)) return this._text;
    return HarmonyToolFence.build(this._text, summary.toolCalls, {
      cutByLength: (summary.finishReason || summary.stopReason) === 'length',
    });
  }

  _finish(result) {
    if (this._done) return;
    this._done = true;
    if (this._timer) clearTimeout(this._timer);
    this._resolve(result);
  }

  _bump() {
    if (this._done || !(this._stallMs > 0)) return;
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(() => this._stall(), this._stallMs);
    if (this._timer.unref) this._timer.unref();
  }

  _stall() {
    if (this._done) return;
    this._stop();
    this._finish({ success: false, error: `completion stalled: no output for ${Math.round(this._stallMs / 1000)}s` });
  }

  _adopt(handle) {
    this._handle = handle;
    if (this._done) { this._stop(); return; }
    const ctl = this._ctl;
    if (!ctl) return;
    if (typeof ctl.isAborted === 'function' && ctl.isAborted()) { this._cancel(); return; }
    if (typeof ctl.onHandle === 'function') {
      try { ctl.onHandle({ abort: () => this._cancel() }); } catch (_) {}
    }
  }

  _cancel() {
    if (this._done) return;
    this._stop();
    this._finish({ success: false, error: 'aborted' });
  }

  _stop() {
    try { if (this._handle && this._handle.abort) this._handle.abort(); } catch (_) {}
  }

  static _call(fn, value) {
    if (!fn) return;
    try { fn(value); } catch (_) {}
  }
}

module.exports = CompletionAttempt;
