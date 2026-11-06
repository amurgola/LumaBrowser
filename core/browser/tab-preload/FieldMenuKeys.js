class FieldMenuKeys {
  static MOVE = new Set(['ArrowDown', 'ArrowUp']);

  constructor(ipcRenderer, win) {
    this._ipc = ipcRenderer;
    this._window = win;
    this._state = { open: false, active: false };
  }

  install() {
    if (!/^https?:$/.test(this._window.location.protocol)) return;
    this._ipc.on('vault:menu-state', (_e, state) => { this._state = { open: !!(state && state.open), active: !!(state && state.active) }; });
    this._window.document.addEventListener('keydown', (e) => this.onKeydown(e), true);
  }

  onKeydown(e) {
    if (!this._state.open || !e.target || e.target.tagName !== 'INPUT') return;
    if (FieldMenuKeys.MOVE.has(e.key) || (e.key === 'Enter' && this._state.active)) {
      e.preventDefault();
      e.stopPropagation();
      this._ipc.send('vault:field-key', { key: e.key });
    } else if (e.key === 'Escape') {
      this._ipc.send('vault:field-key', { key: e.key });
    }
  }
}

module.exports = FieldMenuKeys;
