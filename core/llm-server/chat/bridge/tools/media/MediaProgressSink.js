class MediaProgressSink {
  constructor({ tool, hooks, isAborted, progress = 'steps' }) {
    this._tool = tool;
    this._hooks = hooks || {};
    this._isAborted = isAborted;
    this._progress = progress;
    this.lastError = null;
    this.send = (type, payload) => this._receive(type, payload);
  }

  _receive(type, payload) {
    if (this._isAborted && this._isAborted()) return;
    if (type === 'status' && this._hooks.onStatus) {
      this._hooks.onStatus({ phase: payload && payload.phase, tool: this._tool });
    } else if (type === 'progress' && this._hooks.onToolEvent) {
      this._hooks.onToolEvent({ phase: 'status', tool: this._tool, ...this._progressFields(payload) });
    } else if (type === 'error') {
      this.lastError = payload && payload.message;
    }
  }

  _progressFields(payload) {
    if (this._progress === 'elapsed') return { elapsedMs: payload && payload.elapsedMs };
    return { step: payload && payload.step, totalSteps: payload && payload.totalSteps };
  }
}

module.exports = MediaProgressSink;
