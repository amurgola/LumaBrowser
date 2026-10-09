import AcceleratorTable from './AcceleratorTable.js';

export default class ChromeKeyboard {
  constructor(deps) {
    this._d = deps;
  }

  installShortcuts() {
    document.addEventListener('keydown', (e) => this._onShortcutKey(e));
    if (window.tabAPI && typeof window.tabAPI.onAccelerator === 'function') {
      window.tabAPI.onAccelerator((p) => this._onForwarded(p));
    }
    document.addEventListener('wheel', (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      this._d.tabActions.zoom(this._d.store.activeTabId, e.deltaY < 0 ? 0.1 : -0.1);
    }, { passive: false });
    document.addEventListener('mousedown', (e) => {
      if (e.button === 1 && e.ctrlKey) { e.preventDefault(); this._d.tabActions.zoom(this._d.store.activeTabId, 0, true); }
    });
  }

  installPopupKeys() {
    document.addEventListener('keydown', (e) => {
      if (this._d.host.mode === 'suggestions') return;
      if (this._d.popupMenu.handleKeydown(e)) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    document.addEventListener('keydown', (e) => this._onFanoutKey(e));
  }

  _onShortcutKey(e) {
    const action = AcceleratorTable.forEvent(e);
    if (!action) return;
    if (action === 'stop' && ChromeKeyboard._ownsEscape(e.target, this._d.addressBar.el)) return;
    e.preventDefault();
    this._d.actions.handle(action, this._d.store.activeTabId);
  }

  static _ownsEscape(target, urlBar) {
    return target === urlBar || !!(target && target.closest && target.closest('.find-bar'));
  }

  _onForwarded(p) {
    if (!p || !p.action) return;
    if (p.action === 'open-settings') {
      this._d.host.hide();
      this._d.settings.open(p.settingsTab || 'general');
      return;
    }
    this._d.actions.handle(p.action, p.tabId != null ? p.tabId : this._d.store.activeTabId, { fromPage: true });
  }

  _onFanoutKey(e) {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      this._d.debugTools.dumpViewStack();
    }
    if (e.key !== 'Escape') return;
    const { host, historyModal, bookmarkManager, editBar } = this._d;
    if (host.mode) host.hide();
    if (historyModal.isOpen()) historyModal.close();
    if (bookmarkManager.isOpen()) bookmarkManager.close();
    if (editBar.isOpen()) editBar.close();
  }
}
