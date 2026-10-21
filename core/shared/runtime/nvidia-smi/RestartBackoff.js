class RestartBackoff {
  static DEFAULT_BASE_MS = 1000;
  static DEFAULT_MAX_MS = 60 * 1000;
  static DEFAULT_FACTOR = 2;

  constructor({ baseMs = RestartBackoff.DEFAULT_BASE_MS, maxMs = RestartBackoff.DEFAULT_MAX_MS, factor = RestartBackoff.DEFAULT_FACTOR } = {}) {
    this._baseMs = Number(baseMs) > 0 ? Number(baseMs) : RestartBackoff.DEFAULT_BASE_MS;
    this._maxMs = Number(maxMs) >= this._baseMs ? Number(maxMs) : this._baseMs;
    this._factor = Number(factor) >= 1 ? Number(factor) : RestartBackoff.DEFAULT_FACTOR;
    this.reset();
  }

  get attempts() {
    return this._attempts;
  }

  next() {
    const delay = this.peek();
    this._attempts += 1;
    return delay;
  }

  peek() {
    return Math.min(this._maxMs, this._baseMs * (this._factor ** this._attempts));
  }

  reset() {
    this._attempts = 0;
  }
}

module.exports = RestartBackoff;
