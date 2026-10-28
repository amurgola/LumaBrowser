class ApprovalPresenter {
  static HINT = 'Luma asks';

  constructor({ overlay, getRouter, options = () => ({ show: true, ring: true }), keys = () => ({ allow: '', deny: '' }), onChange = () => {}, log = null }) {
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
    const q = { detail: '', tool: '', params: {}, window: false, grants: '', ...(question || {}) };
    this.clear();
    const o = this._options();
    if (!this._overlay || o.show === false) return false;
    const hwnd = ApprovalPresenter.windowOf(q);
    const session = this._overlay.show({
      kind: 'keys', hint: ApprovalPresenter.HINT, keys: this.choices(q), caption: q.detail,
      ring: o.ring !== false, island: true, frame: hwnd, hwnd,
    }, (id) => this.answer(id));
    this._pending = { question: { detail: q.detail, tool: q.tool, window: q.window, grants: q.grants, hwnd }, session };
    this._changed();
    return true;
  }

  choices(q) {
    const keys = this._keys();
    const out = [{ id: 'once', key: keys.allow || '', label: 'Allow' }];
    if (q.grants) out.push({ id: 'run', key: '', label: `Allow ${q.grants} for this chat` });
    if (q.window) out.push({ id: 'window', key: '', label: 'Only this window' });
    out.push({ id: 'reject', key: keys.deny || '', label: 'Deny' });
    return out;
  }

  answer(decision) {
    if (!this._pending) return false;
    const router = this._router();
    let taken = false;
    try { taken = !!(router && router.respondApproval(decision)); } catch (err) { this._log.warn(`approval answer failed: ${(err && err.message) || err}`); }
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

  static windowOf(q) {
    const hwnd = q.params && q.params.hwnd != null ? Number(q.params.hwnd) : 0;
    return String(q.tool || '').startsWith('desktop_') && Number.isInteger(hwnd) && hwnd > 0 ? hwnd : 0;
  }

  _router() {
    try { return this._getRouter ? this._getRouter() : null; } catch (_) { return null; }
  }

  _changed() {
    try { this._onChange(this.pending); } catch (_) {}
  }
}

module.exports = ApprovalPresenter;
