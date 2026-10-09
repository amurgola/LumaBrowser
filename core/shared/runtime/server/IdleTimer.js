class IdleTimer {
  constructor(onExpire) {
    if (typeof onExpire !== 'function') {
      throw new Error('IdleTimer requires an onExpire callback');
    }
    this._onExpire = onExpire;
    this._ms = 0;
    this._handle = null;
  }

  get ms() {
    return this._ms;
  }

  get armed() {
    return this._handle !== null;
  }

  set(ms) {
    const wasArmed = this.armed;
    this._ms = IdleTimer._normaliseWindow(ms);
    if (wasArmed) this.arm();
  }

  arm() {
    this.disarm();
    if (!this._ms) return;
    this._handle = setTimeout(() => this._expire(), this._ms);
    this._unrefHandle();
  }

  disarm() {
    if (!this._handle) return;
    clearTimeout(this._handle);
    this._handle = null;
  }

  _expire() {
    this._handle = null;
    this._onExpire();
  }

  _unrefHandle() {
    if (this._handle && typeof this._handle.unref === 'function') this._handle.unref();
  }

  static _normaliseWindow(ms) {
    const next = Number(ms) || 0;
    return next > 0 ? next : 0;
  }
}

module.exports = IdleTimer;
