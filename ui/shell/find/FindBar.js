export default class FindBar {
  static DEBOUNCE_MS = 80;

  constructor({ store, bounds, closeEditBar }) {
    this._store = store;
    this._bounds = bounds;
    this._closeEditBar = closeEditBar;
    this._debounce = null;
  }

  install() {
    const bar = document.getElementById('findBar');
    const input = document.getElementById('findInput');
    if (!bar || !input) return;
    input.addEventListener('input', () => {
      clearTimeout(this._debounce);
      this._debounce = setTimeout(() => this.run(input.value, { forward: true, findNext: false }), FindBar.DEBOUNCE_MS);
    });
    input.addEventListener('keydown', (e) => this._onKeydown(e));
    document.getElementById('findPrev')?.addEventListener('click', () => this.step(false));
    document.getElementById('findNext')?.addEventListener('click', () => this.step(true));
    document.getElementById('findClose')?.addEventListener('click', () => this.close(true));
    if (window.tabAPI && typeof window.tabAPI.onFoundInPage === 'function') {
      window.tabAPI.onFoundInPage((res) => this._onFound(res));
    }
  }

  isOpen() {
    const bar = document.getElementById('findBar');
    return !!bar && !bar.hidden;
  }

  static supported() {
    return !!(window.tabAPI && typeof window.tabAPI.findInPage === 'function');
  }

  open() {
    const bar = document.getElementById('findBar');
    const input = document.getElementById('findInput');
    const tab = this._store.active();
    if (!bar || !input || !FindBar.supported()) return;
    if (!tab || (tab.kind || 'user') !== 'user') return;
    this._closeEditBar();
    bar.hidden = false;
    this._bounds.queue();
    input.focus();
    input.select();
    if (input.value.trim()) this.run(input.value, { findNext: false, forward: true });
  }

  close(clearSelection) {
    const bar = document.getElementById('findBar');
    if (!bar || bar.hidden) return;
    bar.hidden = true;
    this.setCount(null);
    const id = this._store.activeTabId;
    if (id != null && window.tabAPI && typeof window.tabAPI.stopFindInPage === 'function') {
      window.tabAPI.stopFindInPage(id, clearSelection ? 'clearSelection' : 'keepSelection');
    }
    this._bounds.queue();
  }

  step(forward) {
    const input = document.getElementById('findInput');
    if (!this.isOpen()) { this.open(); return; }
    if (!input || !input.value.trim()) return;
    this.run(input.value, { forward, findNext: true });
  }

  run(text, { forward = true, findNext = false } = {}) {
    const q = text || '';
    const id = this._store.activeTabId;
    if (id == null || !FindBar.supported()) return;
    if (!q) {
      this.setCount(null);
      if (typeof window.tabAPI.stopFindInPage === 'function') window.tabAPI.stopFindInPage(id, 'clearSelection');
      return;
    }
    try { window.tabAPI.findInPage(id, q, { forward, findNext }); } catch (_) {}
  }

  setCount(res) {
    const el = document.getElementById('findCount');
    const bar = document.getElementById('findBar');
    if (!el) return;
    if (!res) { el.textContent = ''; if (bar) bar.classList.remove('no-match'); return; }
    const matches = res.matches || 0;
    el.textContent = matches ? `${res.activeMatchOrdinal || 0} of ${matches}` : 'No matches';
    if (bar) bar.classList.toggle('no-match', matches === 0);
  }

  _onKeydown(e) {
    if (e.key === 'Enter') { e.preventDefault(); this.step(!e.shiftKey); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.close(true); }
  }

  _onFound(res) {
    if (!res || (res.tabId != null && res.tabId !== this._store.activeTabId)) return;
    if (!this.isOpen()) return;
    this.setCount(res);
  }
}
