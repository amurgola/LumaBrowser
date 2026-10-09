class CommandOutputRelay {
  static STREAM_MS = 100;
  static ABORT_POLL_MS = 250;
  static EVENT = 'command:output';

  constructor(command, opts = {}) {
    this._command = command;
    this._emit = opts.emit;
    this._pending = '';
    this._flushTimer = null;
    this._controller = typeof AbortController === 'function' ? new AbortController() : null;
    this._abortPoll = this._startAbortPoll(opts.isAborted);
  }

  get signal() {
    return this._controller ? this._controller.signal : undefined;
  }

  onOutput(chunk) {
    this._pending += chunk;
    if (!this._flushTimer) this._flushTimer = setTimeout(() => this._flush(), CommandOutputRelay.STREAM_MS);
  }

  close() {
    if (this._abortPoll) clearInterval(this._abortPoll);
    if (this._flushTimer) {
      clearTimeout(this._flushTimer);
      this._flush();
    }
  }

  _startAbortPoll(isAborted) {
    if (!this._controller || typeof isAborted !== 'function') return null;
    return setInterval(() => {
      if (isAborted()) {
        try { this._controller.abort(); } catch (_) {}
      }
    }, CommandOutputRelay.ABORT_POLL_MS);
  }

  _flush() {
    this._flushTimer = null;
    if (!this._pending || typeof this._emit !== 'function') {
      this._pending = '';
      return;
    }
    const chunk = this._pending;
    this._pending = '';
    try { this._emit({ type: CommandOutputRelay.EVENT, payload: { command: this._command, chunk } }); } catch (_) {}
  }
}

module.exports = CommandOutputRelay;
