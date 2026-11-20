export default class ComposerStrip {
  constructor(ctx, className, order) {
    this._ctx = ctx;
    this._className = className;
    this._order = order;
    this._element = null;
    this._bar = null;
  }

  attach(bar) {
    this._bar = bar;
    this.paint();
  }

  paint() {
    if (!this._bar) return;
    const html = this.html();
    if (!html) { this.unmount(); return; }
    if (!this._element) this._createElement();
    this._element.innerHTML = html;
    this._place();
  }

  unmount() {
    if (this._element && this._element.parentNode) this._element.parentNode.removeChild(this._element);
    this._element = null;
  }

  html() {
    return '';
  }

  onClick(_event) {}

  static target(event, attribute) {
    const from = event && event.target;
    return from && from.closest ? from.closest('[' + attribute + ']') : null;
  }

  _createElement() {
    this._element = document.createElement('div');
    this._element.className = this._className;
    this._element.dataset.stripOrder = String(this._order);
    this._element.addEventListener('click', (event) => this.onClick(event));
  }

  _place() {
    const composer = this._bar.querySelector('.cm-composer');
    const host = composer ? composer.parentNode : this._bar;
    const below = Array.from(host.children).find((el) => el !== this._element && Number(el.dataset.stripOrder) > this._order) || composer;
    if (this._element.parentNode === host && this._element.nextElementSibling === (below || null)) return;
    host.insertBefore(this._element, below || null);
  }
}
