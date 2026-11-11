class EmptyReplyRetry {
  static MAX_RETRIES = 2;
  static REASONING_BREAK = '\n\n';

  constructor({ send, hooks, isFinished = () => false, maxRetries = EmptyReplyRetry.MAX_RETRIES }) {
    this._send = send;
    this._hooks = hooks || {};
    this._isFinished = isFinished;
    this._maxRetries = maxRetries;
    this._retries = 0;
    this._aborted = false;
    this._handle = null;
    this._sawText = false;
    this._sawReasoning = false;
  }

  get retries() {
    return this._retries;
  }

  async start() {
    this._handle = await this._send(this._attemptHooks());
    return { abort: () => this.abort() };
  }

  abort() {
    this._aborted = true;
    try { if (this._handle && this._handle.abort) this._handle.abort(); } catch (_) {}
  }

  _attemptHooks() {
    const hooks = this._hooks;
    return {
      ...hooks,
      onDelta: (text) => {
        if (typeof text === 'string' && text.trim()) this._sawText = true;
        if (hooks.onDelta) hooks.onDelta(text);
      },
      onReasoningDelta: (text) => {
        if (text) this._sawReasoning = true;
        if (hooks.onReasoningDelta) hooks.onReasoningDelta(text);
      },
      onDone: (summary) => this._onDone(summary),
    };
  }

  _onDone(summary) {
    if (!this._shouldRetry(summary)) {
      if (this._hooks.onDone) this._hooks.onDone(summary);
      return;
    }
    this._retries += 1;
    if (this._sawReasoning && this._hooks.onReasoningDelta) this._hooks.onReasoningDelta(EmptyReplyRetry.REASONING_BREAK);
    Promise.resolve()
      .then(() => this._send(this._attemptHooks()))
      .then((handle) => {
        this._handle = handle;
        if (this._aborted) this.abort();
      })
      .catch((err) => { if (this._hooks.onError) this._hooks.onError(err); });
  }

  _shouldRetry(summary) {
    if (this._sawText || this._aborted || this._retries >= this._maxRetries) return false;
    if (this._isFinished()) return false;
    const s = summary || {};
    return !(Array.isArray(s.toolCalls) && s.toolCalls.length);
  }
}

module.exports = EmptyReplyRetry;
