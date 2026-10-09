export default class WindowControls {
  static MAXIMIZED_GLYPH = '&#x2750;';

  static RESTORED_GLYPH = '&#x25A1;';

  install() {
    const api = window.windowAPI;
    if (!api) return;
    this._maxBtn = document.getElementById('winMaximize');
    this._wireButton('winMinimize', () => api.minimize());
    this._wireButton('winMaximize', () => api.toggleMaximize());
    this._wireButton('winClose', () => api.close());
    api.onStateChange((state) => this._applyState(state));
  }

  _wireButton(id, action) {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', action);
  }

  _applyState(state) {
    const maximized = !!(state && state.maximized);
    if (this._maxBtn) this._maxBtn.innerHTML = maximized ? WindowControls.MAXIMIZED_GLYPH : WindowControls.RESTORED_GLYPH;
    document.body.classList.toggle('window-maximized', maximized);
  }
}
