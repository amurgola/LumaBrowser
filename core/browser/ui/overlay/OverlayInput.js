export default class OverlayInput {
  constructor(root, api, win) {
    this._root = root;
    this._api = api;
    this._win = win;
    this._doc = root.ownerDocument;
  }

  attach() {
    this._root.addEventListener('mousedown', (e) => this._onMouseDown(e));
    this._root.addEventListener('mousemove', (e) => this._onMouseMove(e));
    this._doc.body.addEventListener('mouseenter', () => this._reportLogHover(true));
    this._doc.body.addEventListener('mouseleave', () => this._reportLogHover(false));
    this._doc.addEventListener('keydown', (e) => this._onKeyDown(e));
    return this;
  }

  _onMouseDown(e) {
    const t = e.target.closest('[data-bd-action]');
    if (!t) return;
    e.preventDefault();
    this._api.sendAction({
      action: t.dataset.bdAction,
      index: t.dataset.bdIndex != null ? Number(t.dataset.bdIndex) : null,
      id: t.dataset.bdId || null,
      url: t.dataset.bdUrl || null,
    });
  }

  _onMouseMove(e) {
    const t = e.target.closest('[data-bd-index]');
    if (!t) return;
    this._api.sendHover({ index: Number(t.dataset.bdIndex) });
  }

  _reportLogHover(hovering) {
    if (this._root.querySelector('.notification-log')) this._api.sendHover({ hovering });
  }

  _onKeyDown(e) {
    if (!(e.ctrlKey || e.metaKey) || (e.key !== 'c' && e.key !== 'C')) return;
    const sel = this._win.getSelection();
    if (sel && String(sel)) {
      try { this._doc.execCommand('copy'); } catch (_) {}
    }
  }
}
