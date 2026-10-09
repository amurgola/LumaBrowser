class StreamPhaseLog {
  constructor(now = Date.now) {
    this._now = now;
    this._startedAt = now();
  }

  line(text) {
    console.log(`[llm-chat] +${this.elapsedMs()}ms ${text}`);
  }

  elapsedMs() {
    return this._now() - this._startedAt;
  }
}

module.exports = StreamPhaseLog;
