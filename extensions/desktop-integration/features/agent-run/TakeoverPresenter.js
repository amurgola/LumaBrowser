class TakeoverPresenter {
  static HINT = 'Luma needs you';

  constructor({ overlay, getRouter, options = () => ({ show: true, ring: true }), keys = () => ({ allow: '', deny: '', stop: '' }), onChange = () => {}, log = null }) {
    this._overlay = overlay || null;
    this._getRouter = getRouter;
    this._options = options;
    this._keys = keys;
    this._onChange = onChange;
    this._log = log || { warn: () => {} };
    this._pending = null;
  }

  get pending() {
    return this._pending ? { ...this._pending.question } : null;
  }

  request(question) {
    const q = { detail: '', ...(question || {}) };
    this.clear();
    const o = this._options();
    if (!this._overlay || o.show === false) return false;
    const session = this._overlay.show({
      kind: 'keys', hint: TakeoverPresenter.HINT, keys: this.choices(), caption: q.detail,
      ring: o.ring !== false, island: true, frame: 0, hwnd: 0,
    }, (id) => this.answer(id));
    this._pending = { question: { detail: q.detail }, session };
    this._changed();
    return true;
  }

  choices() {
    const keys = this._keys();
    return [
      { id: 'continue', key: keys.allow || '', label: 'Done, continue' },
      { id: 'skip', key: keys.deny || '', label: 'Skip this step' },
      { id: 'stop', key: keys.stop || '', label: 'Stop' },
    ];
  }

  answer(action) {
    if (!this._pending) return false;
    const router = this._router();
    let taken = false;
    try { taken = !!(router && router.respondTakeover(action)); } catch (err) { this._log.warn(`takeover answer failed: ${(err && err.message) || err}`); }
    this.clear();
    return taken;
  }

  clear() {
    const pending = this._pending;
    if (!pending) return;
    this._pending = null;
    try { pending.session.close(); } catch (_) {}
    this._changed();
  }

  dispose() {
    this.clear();
  }

  _router() {
    try { return this._getRouter ? this._getRouter() : null; } catch (_) { return null; }
  }

  _changed() {
    try { this._onChange(this.pending); } catch (_) {}
  }
}

module.exports = TakeoverPresenter;
