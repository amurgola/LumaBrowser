class GatewayBinder {
  static FAST_RETRY_MS = 2000;
  static FAST_RETRIES = 30;
  static SLOW_RETRY_MS = 30000;

  constructor({ gateway, onListening, onFirstFailure = null, log = console, setTimeoutFn = setTimeout, clearTimeoutFn = clearTimeout }) {
    this._gateway = gateway;
    this._onListening = onListening;
    this._onFirstFailure = onFirstFailure;
    this._log = log;
    this._setTimeout = setTimeoutFn;
    this._clearTimeout = clearTimeoutFn;
    this._timer = null;
    this._stopped = false;
    this.attempts = 0;
    this.listening = false;
    this.lastError = null;
  }

  async start() {
    await this._attempt();
  }

  stop() {
    this._stopped = true;
    if (this._timer) this._clearTimeout(this._timer);
    this._timer = null;
  }

  async _attempt() {
    if (this._stopped) return;
    this.attempts += 1;
    try {
      await this._gateway.start();
    } catch (err) {
      this._failed(err);
      return;
    }
    this.listening = true;
    this.lastError = null;
    try { this._onListening(); } catch (e) { this._log.error('REST server post-start work failed:', e && e.message ? e.message : e); }
  }

  _failed(err) {
    this.lastError = err && err.message ? err.message : String(err);
    if (this.attempts === 1) {
      this._log.error('Failed to start REST server:', err);
      if (typeof this._onFirstFailure === 'function') {
        Promise.resolve().then(() => this._onFirstFailure(err)).catch(() => {});
      }
    }
    this._schedule();
  }

  _schedule() {
    if (this._stopped) return;
    const delay = this.attempts <= GatewayBinder.FAST_RETRIES ? GatewayBinder.FAST_RETRY_MS : GatewayBinder.SLOW_RETRY_MS;
    this._timer = this._setTimeout(() => { this._timer = null; this._attempt(); }, delay);
    if (this._timer && typeof this._timer.unref === 'function') this._timer.unref();
  }
}

module.exports = GatewayBinder;
