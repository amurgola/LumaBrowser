class HumanWait {
  constructor() {
    this._pending = null;
  }

  isPending() {
    return this._pending !== null;
  }

  wait(timeoutMs) {
    if (this._pending) this._settle(this._supersededAnswer());
    return new Promise((resolve) => {
      const finish = (answer) => {
        if (this._pending && this._pending.timer) clearTimeout(this._pending.timer);
        this._pending = null;
        resolve(this._resultFor(answer));
      };
      const timer = setTimeout(() => finish('timeout'), this._timeoutMs(timeoutMs));
      this._pending = { finish, timer };
    });
  }

  respond(answer) {
    if (!this._pending) return false;
    this._settle(this._normalize(answer));
    return true;
  }

  cancel(answer) {
    if (this._pending) this._settle(answer);
  }

  _settle(answer) {
    try { this._pending.finish(answer); } catch (_) {}
  }

  _timeoutMs(requested) {
    return Number.isFinite(requested) && requested > 0 ? requested : this._defaultTimeoutMs();
  }

  _defaultTimeoutMs() {
    throw new Error(`${this.constructor.name} must implement _defaultTimeoutMs()`);
  }

  _normalize(_answer) {
    throw new Error(`${this.constructor.name} must implement _normalize()`);
  }

  _supersededAnswer() {
    throw new Error(`${this.constructor.name} must implement _supersededAnswer()`);
  }

  _resultFor(_answer) {
    throw new Error(`${this.constructor.name} must implement _resultFor()`);
  }
}

module.exports = HumanWait;
