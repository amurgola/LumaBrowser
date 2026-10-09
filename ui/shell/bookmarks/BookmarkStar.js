export default class BookmarkStar {
  static FILLED = String.fromCharCode(0x2605);

  static EMPTY = String.fromCharCode(0x2606);

  constructor({ tree, store, editBar }) {
    this._tree = tree;
    this._store = store;
    this._editBar = editBar;
    this.btn = null;
  }

  install() {
    this.btn = document.getElementById('bookmarkStarBtn');
    if (this.btn) this.btn.addEventListener('click', () => this.clicked());
  }

  static isWebUrl(url) {
    return /^https?:\/\//i.test(url || '');
  }

  async refresh(url) {
    if (!this.btn || !window.bookmarksAPI) return;
    const active = this._store.active();
    const target = url || (active && active.url) || '';
    if (!BookmarkStar.isWebUrl(target)) {
      this._setPressed(false);
      this.btn.disabled = true;
      return;
    }
    this.btn.disabled = false;
    try {
      const on = await window.bookmarksAPI.isBookmarked(target);
      this._setPressed(!!on);
      this.btn.textContent = on ? BookmarkStar.FILLED : BookmarkStar.EMPTY;
    } catch (_) {}
  }

  async clicked() {
    if (!window.bookmarksAPI) return;
    const tab = this._store.active();
    if (!tab || !BookmarkStar.isWebUrl(tab.url)) return;
    if (this._editBar.isOpen()) { this._editBar.close(); return; }
    let node = this._tree.findByUrl(tab.url);
    let added = false;
    if (!node) {
      try {
        await window.bookmarksAPI.toggleUrl(tab.url, tab.title);
        added = true;
        await this._tree.reload();
        node = this._tree.findByUrl(tab.url);
      } catch (e) { console.warn('add bookmark failed:', e.message); return; }
    }
    await this.refresh(tab.url);
    this._editBar.open(node, tab, added);
  }

  _setPressed(on) {
    this.btn.classList.toggle('bd-active', on);
    this.btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
}
