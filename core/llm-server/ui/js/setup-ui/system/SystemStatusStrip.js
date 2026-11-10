import SystemStatus from './SystemStatus.js';

export default class SystemStatusStrip {
  static STORE_KEY = 'luma.setup.sys.open';

  static ITEMS = [
    { key: 'runtimes', label: 'Runtime', card: 'cardRuntimes' },
    { key: 'models', label: 'Models', card: 'cardModels' },
    { key: 'grounding', label: 'Vision helper', card: 'cardGrounding' },
  ];

  static IMAGE_ITEMS = [
    { key: 'image-runtimes', label: 'Runtime', card: 'cardImageRuntimes' },
    { key: 'image-models', label: 'Models', card: 'cardImageModels' },
  ];

  static IMAGE_STORE_KEY = 'luma.setup.sys.image.open';

  constructor({ doc = document, win = window, rootId = 'systemStrip', items = SystemStatusStrip.ITEMS, storeKey = SystemStatusStrip.STORE_KEY } = {}) {
    this._doc = doc;
    this._win = win;
    this._rootId = rootId;
    this._items = items;
    this._storeKey = storeKey;
    this._status = new Map();
    this._opened = this._load();
    this._session = new Set();
    this._root = null;
    this._onStatus = (e) => this._set(e.detail);
    this._onUnfold = (e) => this._unfoldCard(e.target);
    this._onClick = (e) => this._click(e);
  }

  start() {
    this._root = this._doc.getElementById(this._rootId);
    if (!this._root) return false;
    for (const item of this._items) {
      const card = this._doc.getElementById(item.card);
      if (card) card.setAttribute('data-sys-fold', item.key);
    }
    this._doc.addEventListener(SystemStatus.EVENT, this._onStatus);
    this._doc.addEventListener(SystemStatus.UNFOLD_EVENT, this._onUnfold);
    this._root.addEventListener('click', this._onClick);
    this._root.innerHTML = this._items.map((item) => SystemStatusStrip.itemHtml(item)).join('');
    this._apply();
    return true;
  }

  stop() {
    this._doc.removeEventListener(SystemStatus.EVENT, this._onStatus);
    this._doc.removeEventListener(SystemStatus.UNFOLD_EVENT, this._onUnfold);
    if (this._root) this._root.removeEventListener('click', this._onClick);
  }

  static itemHtml(item) {
    return `<button type="button" class="sys-item" data-sys-item="${item.key}" aria-controls="${item.card}" aria-expanded="false">`
      + `<span class="sys-label">${item.label}</span><span class="sys-value" data-sys-value>Checking…</span></button>`;
  }

  isOpen(key) {
    const s = this._status.get(key);
    return this._opened.has(key) || this._session.has(key) || SystemStatusStrip.demandsOpen(s);
  }

  static demandsOpen(s) {
    return !!(s && (s.tone === 'attention' || s.tone === 'busy'));
  }

  _owns(key) {
    return this._items.some((i) => i.key === key);
  }

  _set(detail) {
    if (!detail || !detail.key || !this._owns(detail.key)) return;
    const prev = this._status.get(detail.key);
    if (SystemStatusStrip.demandsOpen(prev) && !SystemStatusStrip.demandsOpen(detail)) this._session.add(detail.key);
    if (prev && prev.tone === detail.tone && prev.value === detail.value && prev.title === detail.title) return;
    this._status.set(detail.key, { tone: detail.tone, value: detail.value, title: detail.title || '' });
    this._apply();
  }

  _apply() {
    if (!this._root) return;
    for (const item of this._items) {
      const s = this._status.get(item.key) || { tone: 'pending', value: 'Checking…', title: '' };
      const open = this.isOpen(item.key);
      const btn = this._root.querySelector(`[data-sys-item="${item.key}"]`);
      if (btn) {
        btn.dataset.tone = s.tone;
        btn.setAttribute('aria-expanded', String(open));
        btn.classList.toggle('is-open', open);
        btn.title = s.title || '';
        const value = btn.querySelector('[data-sys-value]');
        if (value) value.textContent = s.value;
      }
      const card = this._doc.getElementById(item.card);
      if (card) card.classList.toggle('sys-folded', !open);
    }
  }

  _click(e) {
    const btn = e.target.closest('[data-sys-item]');
    if (!btn) return;
    const key = btn.dataset.sysItem;
    const s = this._status.get(key);
    if (this.isOpen(key) && !SystemStatusStrip.demandsOpen(s)) {
      this._opened.delete(key);
      this._session.delete(key);
    } else {
      this._opened.add(key);
      this._scrollTo(key);
    }
    this._save();
    this._apply();
  }

  _unfoldCard(card) {
    const key = card && card.getAttribute && card.getAttribute('data-sys-fold');
    if (!key || !this._owns(key) || this.isOpen(key)) return;
    this._session.add(key);
    this._apply();
  }

  _scrollTo(key) {
    const item = this._items.find((i) => i.key === key);
    const card = item && this._doc.getElementById(item.card);
    if (!card || typeof card.scrollIntoView !== 'function') return;
    this._win.requestAnimationFrame(() => card.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  }

  _load() {
    try {
      const raw = this._win.localStorage.getItem(this._storeKey);
      const list = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(list) ? list : []);
    } catch (_) { return new Set(); }
  }

  _save() {
    try { this._win.localStorage.setItem(this._storeKey, JSON.stringify([...this._opened])); } catch (_) {}
  }
}
