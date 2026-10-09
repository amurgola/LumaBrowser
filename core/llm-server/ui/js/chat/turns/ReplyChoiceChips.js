import Dom from '../../dom/Dom.js';

export default class ReplyChoiceChips {
  constructor(ctx) {
    this._ctx = ctx;
  }

  create(items) {
    const box = Dom.el('div', 'cm-choices');
    for (const c of items) box.appendChild(this._chip(c));
    return box;
  }

  _chip(text) {
    const b = Dom.el('button', 'cm-chip cm-choice');
    b.type = 'button';
    b.textContent = text;
    b.title = 'Send this reply';
    b.addEventListener('click', () => {
      if (this._ctx.state.streaming) return;
      this._ctx.sender.submit(text);
    });
    return b;
  }
}
