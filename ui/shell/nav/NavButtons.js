export default class NavButtons {
  static HOLD_MS = 450;

  constructor({ store, historyMenu }) {
    this._store = store;
    this._historyMenu = historyMenu;
    this.backBtn = document.getElementById('backBtn');
    this.forwardBtn = document.getElementById('forwardBtn');
    this.reloadBtn = document.getElementById('reloadBtn');
  }

  install() {
    this._wireHistoryButton(this.backBtn, (id) => window.tabAPI.goBack(id));
    this._wireHistoryButton(this.forwardBtn, (id) => window.tabAPI.goForward(id));
    this.reloadBtn.addEventListener('click', () => this._reloadOrStop());
  }

  setHistoryState(state) {
    if (this.backBtn) this.backBtn.disabled = !state.canGoBack;
    if (this.forwardBtn) this.forwardBtn.disabled = !state.canGoForward;
  }

  updateReloadButton() {
    const btn = this.reloadBtn;
    if (!btn) return;
    const loading = this._activeIsLoading();
    if (btn.dataset.mode === (loading ? 'stop' : 'reload')) return;
    btn.dataset.mode = loading ? 'stop' : 'reload';
    const use = btn.querySelector('use');
    if (use) use.setAttribute('href', loading ? '#i-x' : '#i-rotate-cw');
    btn.title = loading ? 'Stop loading (Esc)' : 'Reload (Ctrl+R)';
    btn.setAttribute('aria-label', loading ? 'Stop loading' : 'Reload');
    btn.classList.toggle('is-stop', loading);
  }

  _activeIsLoading() {
    const tab = this._store.activeTabId != null ? this._store.get(this._store.activeTabId) : null;
    return !!(tab && tab.loading) && !!(window.tabAPI && typeof window.tabAPI.stop === 'function');
  }

  _reloadOrStop() {
    const id = this._store.activeTabId;
    if (id === null || !window.tabAPI) return;
    const tab = this._store.get(id);
    if (tab && tab.loading && typeof window.tabAPI.stop === 'function') window.tabAPI.stop(id);
    else window.tabAPI.reload(id);
  }

  _wireHistoryButton(btn, navFn) {
    let holdTimer = null;
    let longPressed = false;
    const openMenu = () => {
      const r = btn.getBoundingClientRect();
      this._historyMenu.show(r.left, r.bottom);
    };
    const cancelHold = () => { if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; } };
    btn.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      longPressed = false;
      cancelHold();
      holdTimer = setTimeout(() => { longPressed = true; openMenu(); }, NavButtons.HOLD_MS);
    });
    btn.addEventListener('mouseup', cancelHold);
    btn.addEventListener('mouseleave', cancelHold);
    btn.addEventListener('click', () => {
      if (longPressed) { longPressed = false; return; }
      if (this._store.activeTabId !== null && window.tabAPI) navFn(this._store.activeTabId);
    });
    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      cancelHold();
      openMenu();
    });
  }
}
