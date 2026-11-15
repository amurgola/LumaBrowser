class OutputWatch {
  constructor(conditions, timers = { setTimeout, clearTimeout }) {
    this._conditions = conditions;
    this._timers = timers;
    this._settled = false;
    this._idleTimer = null;
    this.promise = new Promise((resolve) => { this._resolve = resolve; });
    this._timeoutTimer = timers.setTimeout(() => this._settle('timeout'), Math.max(0, conditions.timeoutMs || 0));
    this._armIdle();
  }

  get settled() {
    return this._settled;
  }

  onOutput() {
    if (this._settled) return;
    if (this._conditions.matches && this._conditions.matches()) return this._settle('pattern');
    this._armIdle();
  }

  onPrompt() {
    if (this._conditions.untilPrompt) this._settle('prompt');
  }

  onExit() {
    this._settle('exit');
  }

  cancel() {
    this._settle('cancelled');
  }

  _armIdle() {
    if (!(this._conditions.idleMs > 0)) return;
    if (this._idleTimer) this._timers.clearTimeout(this._idleTimer);
    this._idleTimer = this._timers.setTimeout(() => this._onIdle(), this._conditions.idleMs);
  }

  _onIdle() {
    const accept = this._conditions.idleAccept;
    if (!accept || accept()) this._settle('idle');
    else this._armIdle();
  }

  _settle(reason) {
    if (this._settled) return;
    this._settled = true;
    this._timers.clearTimeout(this._timeoutTimer);
    if (this._idleTimer) this._timers.clearTimeout(this._idleTimer);
    this._resolve(reason);
  }
}

module.exports = OutputWatch;
