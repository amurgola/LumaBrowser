export default class WindowControls {
  static MAXIMIZED_GLYPH = '<svg class="icon" aria-hidden="true"><use href="#i-win-restore"/></svg>';

  static RESTORED_GLYPH = '<svg class="icon" aria-hidden="true"><use href="#i-win-max"/></svg>';

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
    if (this._maxBtn) {
      this._maxBtn.innerHTML = maximized ? WindowControls.MAXIMIZED_GLYPH : WindowControls.RESTORED_GLYPH;
      const label = maximized ? 'Restore' : 'Maximize';
      this._maxBtn.title = label;
      this._maxBtn.setAttribute('aria-label', label);
    }
    document.body.classList.toggle('window-maximized', maximized);
  }
}
