class RunClock {
  constructor(timeoutMs, now = Date.now()) {
    this._timeoutMs = timeoutMs;
    this._startedAt = now;
    this._deadline = RunClock._hasWallClock(timeoutMs) ? now + timeoutMs : Infinity;
  }

  get timeoutMs() {
    return this._timeoutMs;
  }

  expired(now = Date.now()) {
    return now >= this._deadline;
  }

  remainingMs(now = Date.now()) {
    return this._deadline - now;
  }

  elapsedMs(now = Date.now()) {
    return now - this._startedAt;
  }

  extend(ms) {
    if (Number.isFinite(this._deadline)) this._deadline += ms;
  }

  static _hasWallClock(timeoutMs) {
    return Number.isFinite(timeoutMs) && timeoutMs > 0;
  }
}

module.exports = RunClock;
