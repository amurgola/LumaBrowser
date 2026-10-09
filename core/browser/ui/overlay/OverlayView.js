import FaviconFallback from './FaviconFallback.js';

export default class OverlayView {
  constructor(root, api, win) {
    this._root = root;
    this._api = api;
    this._win = win;
  }

  attach() {
    this._api.onContent((p) => this.render(p));
    this._api.onSetActive((p) => this.setActive(p));
    return this;
  }

  render({ html } = {}) {
    this._root.innerHTML = html || '';
    FaviconFallback.apply(this._root);
    this._win.requestAnimationFrame(() => this._win.requestAnimationFrame(() => this.measure()));
  }

  measure() {
    const body = this._root.ownerDocument.body;
    const h = Math.ceil(body.getBoundingClientRect().height) || this._root.scrollHeight;
    this._api.measure(h);
  }

  setActive({ activeIndex } = {}) {
    this._root.querySelectorAll('[data-bd-index]').forEach((el) => {
      el.classList.toggle('bd-active', Number(el.dataset.bdIndex) === activeIndex);
    });
  }
}
