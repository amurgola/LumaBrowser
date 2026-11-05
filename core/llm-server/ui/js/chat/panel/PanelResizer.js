import Dom from '../../dom/Dom.js';

export default class PanelResizer {
  static WIDTH_KEY = 'luma.chat.panelWidth';
  static MIN_PANEL = 320;
  static MIN_CHAT = 320;
  static KEY_STEP = 24;

  constructor({ panel, stage, root, onResize }) {
    this._panel = panel;
    this._stage = stage;
    this._root = root;
    this._onResize = onResize || (() => {});
    this._drag = null;
    this._frame = 0;
    this._handle = null;
  }

  install() {
    const h = Dom.el('div', 'cm-ap-resize');
    h.setAttribute('role', 'separator');
    h.setAttribute('aria-orientation', 'vertical');
    h.setAttribute('aria-label', 'Resize the artifact panel');
    h.tabIndex = 0;
    h.title = 'Drag to resize. Double click to reset.';
    h.addEventListener('pointerdown', (e) => this._down(e));
    h.addEventListener('pointermove', (e) => this._move(e));
    h.addEventListener('pointerup', (e) => this._up(e));
    h.addEventListener('pointercancel', (e) => this._up(e));
    h.addEventListener('dblclick', () => this.reset());
    h.addEventListener('keydown', (e) => this._key(e));
    this._panel.insertBefore(h, this._panel.firstChild);
    this._handle = h;
    this.restore();
  }

  restore() {
    const w = Number(PanelResizer._load());
    if (w > 0) this._apply(w, false);
  }

  reset() {
    this._panel.style.flexBasis = '';
    PanelResizer._save(null);
    this._notify();
  }

  clamp(width) {
    const total = this._stage.clientWidth || 0;
    const max = total > 0 ? Math.max(PanelResizer.MIN_PANEL, total - PanelResizer.MIN_CHAT) : width;
    return Math.round(Math.max(PanelResizer.MIN_PANEL, Math.min(max, width)));
  }

  isTheater() {
    return this._root.classList.contains('cm-panel-theater');
  }

  setTheater(on) {
    this._root.classList.toggle('cm-panel-theater', !!on);
    this._notify();
  }

  toggleTheater() {
    this.setTheater(!this.isTheater());
  }

  _down(e) {
    if (e.button !== 0 || this.isTheater()) return;
    e.preventDefault();
    this._drag = { id: e.pointerId };
    try { this._handle.setPointerCapture(e.pointerId); } catch (_) {}
    document.body.classList.add('cm-ap-resizing');
  }

  _move(e) {
    if (!this._drag || this._drag.id !== e.pointerId) return;
    const right = this._stage.getBoundingClientRect().right;
    this._apply(right - e.clientX, false);
  }

  _up(e) {
    if (!this._drag || this._drag.id !== e.pointerId) return;
    this._drag = null;
    document.body.classList.remove('cm-ap-resizing');
    PanelResizer._save(this._width());
    this._notify();
  }

  _key(e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const d = e.key === 'ArrowLeft' ? PanelResizer.KEY_STEP : -PanelResizer.KEY_STEP;
    this._apply(this._width() + d, true);
  }

  _apply(width, save) {
    const w = this.clamp(width);
    this._panel.style.flexBasis = w + 'px';
    if (save) PanelResizer._save(w);
    this._notify();
  }

  _width() {
    return Math.round(this._panel.getBoundingClientRect().width) || PanelResizer.MIN_PANEL;
  }

  _notify() {
    if (this._frame) return;
    const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (fn) => setTimeout(fn, 16);
    this._frame = raf(() => { this._frame = 0; this._onResize(); });
  }

  static _load() {
    try { return localStorage.getItem(PanelResizer.WIDTH_KEY); } catch (_) { return null; }
  }

  static _save(w) {
    try {
      if (w) localStorage.setItem(PanelResizer.WIDTH_KEY, String(w));
      else localStorage.removeItem(PanelResizer.WIDTH_KEY);
    } catch (_) {}
  }
}
