class CapturedBridgeRun {
  constructor({ timeoutMs, onToolEvent = null } = {}) {
    this._timeoutMs = timeoutMs;
    this._remainingMs = timeoutMs;
    this._onToolEvent = typeof onToolEvent === 'function' ? onToolEvent : null;
    this._text = '';
    this._toolTrace = [];
    this._error = null;
    this._settled = false;
    this._timer = null;
    this._armedAt = 0;
    this._handle = null;
    this._resolve = null;
  }

  run(bridge, options) {
    return new Promise((resolve) => {
      this._resolve = resolve;
      this._startBridge(bridge, options);
      this._watchHandle();
      if (!this._settled) this._armTimeout();
    });
  }

  get settled() {
    return this._settled;
  }

  pauseTimeout() {
    if (!this._timer) return;
    clearTimeout(this._timer);
    this._timer = null;
    this._remainingMs = Math.max(1000, this._remainingMs - (Date.now() - this._armedAt));
  }

  resumeTimeout() {
    if (!this._settled && !this._timer) this._armTimeout();
  }

  _startBridge(bridge, options) {
    try {
      this._handle = bridge.run({ ...options, hooks: this._hooks() });
    } catch (err) {
      this._fail(err);
    }
  }

  _watchHandle() {
    const handle = this._handle;
    if (!handle || !handle.done || typeof handle.done.then !== 'function') return;
    handle.done.then(() => this._finish(), (err) => {
      if (!this._error) this._error = CapturedBridgeRun._asError(err);
      this._finish();
    });
  }

  _hooks() {
    return {
      onDelta: (text) => { this._text += text || ''; },
      onContentRollback: (chars) => { this._text = chars >= this._text.length ? '' : this._text.slice(0, -chars); },
      onToolEvent: (ev) => { if (ev && !this._settled && this._onToolEvent) this._onToolEvent(ev); },
      onToolTrace: ({ tools } = {}) => { if (Array.isArray(tools)) this._toolTrace = [...tools]; },
      onError: (err) => this._fail(err),
      onDone: () => this._finish(),
    };
  }

  _armTimeout() {
    this._timer = setTimeout(() => this._timedOut(), this._remainingMs);
    if (this._timer.unref) this._timer.unref();
    this._armedAt = Date.now();
  }

  _timedOut() {
    if (this._settled) return;
    this._error = new Error(`run timed out after ${Math.round(this._timeoutMs / 60000)} minutes`);
    try { if (this._handle && this._handle.abort) this._handle.abort(); } catch (_) {}
    this._finish();
  }

  _fail(err) {
    this._error = CapturedBridgeRun._asError(err);
    this._finish();
  }

  _finish() {
    if (this._settled) return;
    this._settled = true;
    if (this._timer) clearTimeout(this._timer);
    this._timer = null;
    this._resolve({ finalResponse: this._text, toolTrace: this._toolTrace, error: this._error });
  }

  static _asError(err) {
    return err instanceof Error ? err : new Error(String(err));
  }
}

module.exports = CapturedBridgeRun;
