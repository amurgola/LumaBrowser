export default class FullscreenMode {
  static BODY_CLASS = 'browser-fullscreen';

  static HINT_MS = 3000;

  static HINT_LAYER = 'fs-hint';

  static PLACE_DELAY_MS = 250;

  constructor({ host }) {
    this._host = host;
    this._window = false;
    this._page = false;
    this._hintTimer = null;
  }

  install() {
    const api = window.windowAPI;
    if (!api) return;
    api.onStateChange((state) => this.onWindowState(state));
    if (typeof api.onPageFullscreen === 'function') api.onPageFullscreen((p) => this.onPageFullscreen(p));
  }

  onWindowState(state) {
    const full = !!(state && state.fullScreen);
    if (full === this._window) return;
    this._window = full;
    this._apply();
    if (full && !this._page) this._hint('Press F11 to exit full screen');
  }

  onPageFullscreen(p) {
    this._page = !!(p && p.on);
    if (this._host) this._host.hide();
    this._apply();
    if (this._page) this._hint('Press Esc to exit full screen');
  }

  _apply() {
    document.body.classList.toggle(FullscreenMode.BODY_CLASS, this._window && !this._page);
  }

  static hintHtml(text) {
    const safe = String(text).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    return '<style>.bd-fs-hint { padding: 10px 16px; text-align: center; font-size: 13px; color: var(--text); }</style>'
      + `<div class="bd-context-menu bd-fs-hint">${safe}</div>`;
  }

  _hint(text) {
    const api = window.chromeOverlayAPI;
    if (!api) return;
    const width = 300;
    clearTimeout(this._hintTimer);
    this._hintTimer = setTimeout(() => {
      api.show({ id: FullscreenMode.HINT_LAYER, html: FullscreenMode.hintHtml(text), x: Math.round((window.innerWidth - width) / 2), y: 24, width, estHeight: 44, maxHeight: 60 });
      this._hintTimer = setTimeout(() => api.hide(FullscreenMode.HINT_LAYER), FullscreenMode.HINT_MS);
    }, FullscreenMode.PLACE_DELAY_MS);
  }
}
