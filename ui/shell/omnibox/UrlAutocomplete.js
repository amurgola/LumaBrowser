import OmniboxResolver from './OmniboxResolver.js';
import SuggestionsHtml from './SuggestionsHtml.js';
import UrlSecurityBadge from '../nav/UrlSecurityBadge.js';

export default class UrlAutocomplete {
  static DEBOUNCE_MS = 120;

  static LIMIT = 7;

  static BLUR_HIDE_MS = 150;

  constructor({ addressBar, store, host, engine, favicons, tabActions }) {
    this._bar = addressBar;
    this._store = store;
    this._host = host;
    this._engine = engine;
    this._favicons = favicons;
    this._tabActions = tabActions;
    this.items = [];
    this.active = -1;
    this._seq = 0;
    this._debounce = null;
    this._selectOnMouseUp = false;
    this._down = { x: 0, y: 0 };
    host.onHide(() => { this.items = []; this.active = -1; });
  }

  isOpen() {
    return this._host.mode === 'suggestions';
  }

  install() {
    const el = this._bar.el;
    if (!el) return;
    el.addEventListener('input', () => this._onInput());
    el.addEventListener('keydown', (e) => this._onKeydown(e));
    el.addEventListener('mousedown', (e) => this._onMouseDown(e));
    el.addEventListener('mouseup', (e) => this._onMouseUp(e));
    document.addEventListener('mouseup', () => { this._selectOnMouseUp = false; });
    el.addEventListener('focus', () => this._onFocus());
    el.addEventListener('blur', () => this._onBlur());
  }

  hide() {
    this.items = [];
    this.active = -1;
    if (this.isOpen()) this._host.hide();
  }

  navigateTo(text) {
    const url = OmniboxResolver.resolve(text, (q) => this._engine.searchUrl(q));
    if (url) this._tabActions.navigate(url);
  }

  async update(query) {
    const q = (query || '').trim();
    if (!q) { this.hide(); return; }
    const seq = ++this._seq;
    const matches = await UrlAutocomplete._historyMatches(q);
    if (seq !== this._seq || !this._bar.isFocused()) return;
    this.items = this._itemsFor(q, matches);
    this.active = -1;
    this._show(q);
    this._favicons.prefetch(matches.map((m) => m.url)).then((changed) => {
      if (changed && this.isOpen() && this._bar.isFocused()) this._show(q);
    });
  }

  commit(index) {
    const item = this.items[index];
    this.hide();
    if (!item) { this.navigateTo(this._bar.el.value); return; }
    if (item.kind === 'search') this.navigateTo(item.query);
    else this._tabActions.navigate(item.url);
    this._bar.el.blur();
  }

  setActive(index) {
    this.active = index;
    UrlAutocomplete._highlight(index);
  }

  _itemsFor(q, matches) {
    const items = matches.map((m) => ({ kind: 'history', url: m.url, title: m.title }));
    if (OmniboxResolver.looksLikeUrl(q)) {
      items.unshift({ kind: 'navigate', url: OmniboxResolver.resolve(q, (s) => this._engine.searchUrl(s)) });
    }
    items.push({ kind: 'search', query: q });
    return items;
  }

  static async _historyMatches(q) {
    try { return await window.historyAPI.suggest(q, { limit: UrlAutocomplete.LIMIT }); } catch (_) { return []; }
  }

  _show(query) {
    if (!this.items.length) { this.hide(); return; }
    const r = this._bar.anchorRect();
    const { items, active } = this;
    this._host.show('suggestions', {
      html: SuggestionsHtml.render({ items, active, query, engineName: this._engine.name(), favicons: this._favicons }),
      x: r.left,
      y: r.bottom + 4,
      width: r.width,
      estHeight: items.length * 46 + 2,
    });
  }

  _onInput() {
    clearTimeout(this._debounce);
    const val = this._bar.el.value;
    const tab = this._store.active();
    UrlSecurityBadge.update(tab && val === tab.url ? val : '');
    this._debounce = setTimeout(() => this.update(val), UrlAutocomplete.DEBOUNCE_MS);
  }

  _onKeydown(e) {
    const open = this.isOpen() && this.items.length;
    if (e.key === 'ArrowDown' && open) {
      e.preventDefault();
      this.setActive((this.active + 1) % this.items.length);
    } else if (e.key === 'ArrowUp' && open) {
      e.preventDefault();
      this.setActive((this.active - 1 + this.items.length) % this.items.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      this._enter(open);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this._escape(open);
    }
  }

  _enter(open) {
    if (open && this.active >= 0) { this.commit(this.active); return; }
    this.hide();
    this.navigateTo(this._bar.el.value);
    this._bar.el.blur();
  }

  _escape(open) {
    const tabUrl = (this._store.active() || {}).url || '';
    const alreadyReverted = !open && this._bar.el.value === tabUrl;
    if (open) this.hide();
    this._bar.revert();
    if (alreadyReverted) this._bar.el.blur();
  }

  _onMouseDown(e) {
    if (this._bar.isFocused()) return;
    this._selectOnMouseUp = true;
    this._down = { x: e.clientX, y: e.clientY };
  }

  _onMouseUp(e) {
    if (!this._selectOnMouseUp) return;
    this._selectOnMouseUp = false;
    if (Math.abs(e.clientX - this._down.x) > 3 || Math.abs(e.clientY - this._down.y) > 3) return;
    e.preventDefault();
    this._bar.el.select();
  }

  _onFocus() {
    if (!this._selectOnMouseUp) this._bar.el.select();
    if (this._bar.el.value.trim()) this.update(this._bar.el.value);
  }

  _onBlur() {
    setTimeout(() => this.hide(), UrlAutocomplete.BLUR_HIDE_MS);
    const tab = this._store.active();
    if (tab && this._bar.el.value !== (tab.url || '')) this._bar.revert();
  }

  static _highlight(index) {
    if (window.chromeOverlayAPI) window.chromeOverlayAPI.setActive(index);
  }
}
