export default class ChromeOverlayHost {
  static PAD = 0;

  static MENU_MODES = ['folder', 'context', 'settings-menu'];

  static BLUR_DISMISS_MS = 150;

  constructor() {
    this.mode = null;
    this._blurTimer = null;
    this._hideHooks = [];
    this._exemptions = [];
    this._onOutside = (e) => this._outsideMousedown(e);
  }

  onHide(fn) {
    this._hideHooks.push(fn);
  }

  addDismissExemption(fn) {
    this._exemptions.push(fn);
  }

  isMenuOpen() {
    return ChromeOverlayHost.MENU_MODES.includes(this.mode);
  }

  show(mode, { html, x, y, width, estHeight }) {
    if (!window.chromeOverlayAPI) return;
    this.mode = mode;
    window.chromeOverlayAPI.show({ id: 'popup', html, ...ChromeOverlayHost.place({ x, y, width, estHeight }) });
  }

  static place({ x, y, width, estHeight }) {
    const maxHeight = Math.round(window.innerHeight * 0.7);
    const vw = width + ChromeOverlayHost.PAD * 2;
    const vx = Math.max(0, Math.min(x - ChromeOverlayHost.PAD, window.innerWidth - vw));
    let vy = y;
    if (estHeight && vy + estHeight > window.innerHeight) vy = Math.max(0, window.innerHeight - estHeight);
    return { x: vx, y: vy, width: vw, maxHeight, estHeight };
  }

  hide() {
    this.cancelBlurHide();
    this.mode = null;
    for (const fn of this._hideHooks) fn();
    if (window.chromeOverlayAPI) window.chromeOverlayAPI.hide();
    document.removeEventListener('mousedown', this._onOutside, true);
  }

  armDismiss() {
    setTimeout(() => document.addEventListener('mousedown', this._onOutside, true), 0);
  }

  cancelBlurHide() {
    if (this._blurTimer) { clearTimeout(this._blurTimer); this._blurTimer = null; }
  }

  install({ onResize } = {}) {
    window.addEventListener('blur', () => this._onWindowBlur());
    window.addEventListener('resize', () => {
      if (this.mode) this.hide();
      if (onResize) onResize();
    });
  }

  _onWindowBlur() {
    if (this.mode !== 'folder' && this.mode !== 'context') return;
    this.cancelBlurHide();
    this._blurTimer = setTimeout(() => { this._blurTimer = null; this.hide(); }, ChromeOverlayHost.BLUR_DISMISS_MS);
  }

  _outsideMousedown(e) {
    if (this._exemptions.some((fn) => fn(e))) return;
    if (this.isMenuOpen()) this.hide();
  }
}
