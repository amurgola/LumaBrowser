class MediaProgressSink {
  static REMOTE_PHASE = 'remote';

  constructor({ tool, hooks, isAborted, progress = 'steps' }) {
    this._tool = tool;
    this._hooks = hooks || {};
    this._isAborted = isAborted;
    this._progress = progress;
    this.lastError = null;
    this.reachedServer = false;
    this.send = (type, payload) => this._receive(type, payload);
  }

  _receive(type, payload) {
    if (this._isAborted && this._isAborted()) return;
    if (type === 'status') this._noteServerPhase(payload);
    if (type === 'status' && this._hooks.onStatus) {
      this._hooks.onStatus({ phase: payload && payload.phase, tool: this._tool });
    } else if (type === 'progress' && this._hooks.onToolEvent) {
      this._hooks.onToolEvent({ phase: 'status', tool: this._tool, ...this._progressFields(payload) });
    } else if (type === 'error') {
      this.lastError = payload && payload.message;
    }
  }

  _noteServerPhase(payload) {
    const phase = payload && payload.phase;
    if (phase && phase !== MediaProgressSink.REMOTE_PHASE) this.reachedServer = true;
  }

  _progressFields(payload) {
    if (this._progress === 'elapsed') return { elapsedMs: payload && payload.elapsedMs };
    return { step: payload && payload.step, totalSteps: payload && payload.totalSteps };
  }
}

module.exports = MediaProgressSink;
