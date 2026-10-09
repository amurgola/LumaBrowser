export default class PollingHint {
  constructor(ctx, hintId) {
    this._ctx = ctx;
    this._hintId = hintId;
    this._timer = null;
  }

  async refresh() {
    this._stop();
    if (!this._available() || !this._hint()) return;
    const status = await this._safeFetch();
    if (!status) return;
    this._onStatus(status);
    const hint = this._hint();
    if (!hint) return;
    const delay = this.paint(hint, status);
    if (delay) this._timer = setTimeout(() => this.refresh(), delay);
  }

  _available() {
    throw new Error(`${this.constructor.name} must implement _available()`);
  }

  async _fetch() {
    throw new Error(`${this.constructor.name} must implement _fetch()`);
  }

  paint() {
    throw new Error(`${this.constructor.name} must implement paint()`);
  }

  _onStatus() {}

  async _safeFetch() {
    try { return await this._fetch(); } catch (_) { return null; }
  }

  _hint() {
    return this._ctx.doc.getElementById(this._hintId);
  }

  _stop() {
    if (!this._timer) return;
    clearTimeout(this._timer);
    this._timer = null;
  }
}
