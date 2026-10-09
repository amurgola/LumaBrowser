import UrlSecurityBadge from '../nav/UrlSecurityBadge.js';

export default class AddressBar {
  constructor({ el, store }) {
    this.el = el;
    this._store = store;
  }

  isFocused() {
    return !!this.el && document.activeElement === this.el;
  }

  showUrl(url) {
    if (!this.el) return;
    this.el.value = url || '';
    UrlSecurityBadge.update(url || '');
  }

  showUrlUnlessEditing(url) {
    if (this.el && !this.isFocused()) this.showUrl(url);
  }

  revert() {
    const tab = this._store.active();
    if (this.el) this.showUrl((tab && tab.url) || '');
  }

  focusAndSelect() {
    if (!this.el) return;
    this.el.focus();
    this.el.select();
  }

  setPlaceholder(text) {
    if (this.el) this.el.placeholder = text;
  }

  anchorRect() {
    const wrap = this._wrap();
    return wrap ? wrap.getBoundingClientRect() : null;
  }

  _wrap() {
    if (!this.el) return null;
    return (this.el.closest && this.el.closest('.url-bar-wrap')) || this.el;
  }
}
