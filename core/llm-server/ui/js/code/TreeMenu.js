import Dom from '../dom/Dom.js';
import HtmlEscaper from '../format/HtmlEscaper.js';

export default class TreeMenu {
  constructor(host) {
    this._host = host;
    this._el = null;
  }

  open(x, y, items) {
    this.close();
    const menu = Dom.el('div', 'ce-menu');
    for (const item of items) menu.appendChild(this._item(item));
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    this._host.appendChild(menu);
    this._el = menu;
    const outside = (ev) => {
      if (this._el && !this._el.contains(ev.target)) { this.close(); document.removeEventListener('mousedown', outside, true); }
    };
    document.addEventListener('mousedown', outside, true);
  }

  close() {
    if (!this._el) return;
    this._el.remove();
    this._el = null;
  }

  _item(item) {
    const button = Dom.el('button', 'ce-menu-item' + (item.danger ? ' ce-menu-item--danger' : ''), HtmlEscaper.escape(item.label));
    button.type = 'button';
    button.addEventListener('click', () => { this.close(); item.run(); });
    return button;
  }
}
