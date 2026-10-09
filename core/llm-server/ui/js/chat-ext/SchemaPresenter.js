import Dom from '../dom/Dom.js';
import SchemaCard from './SchemaCard.js';

export default class SchemaPresenter {
  constructor(card = new SchemaCard()) {
    this._card = card;
  }

  openModal(schema, opts = {}) {
    return new Promise((resolve) => {
      const back = Dom.el('div', 'luma-modal-overlay');
      const close = (value) => { back.remove(); resolve(value); };
      const card = this._card.build(schema, opts, close);
      card.style.width = 'min(680px,92vw)';
      back.appendChild(card);
      document.body.appendChild(back);
      back.addEventListener('click', (e) => { if (e.target === back) close(null); });
    });
  }

  openInline(schema, opts = {}) {
    if (!opts.host) return this.openModal(schema, opts);
    return new Promise((resolve) => {
      let card = null;
      const close = (value) => { card.remove(); resolve(value); };
      card = this._card.build(schema, opts, close);
      card.classList.add('luma-modal--inline');
      opts.host.appendChild(card);
    });
  }
}
