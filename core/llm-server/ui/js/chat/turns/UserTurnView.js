import AttachmentCard from './AttachmentCard.js';
import AttachmentStrip from '../composer/AttachmentStrip.js';
import Dom from '../../dom/Dom.js';
import AttachmentParser from '../../markdown/AttachmentParser.js';

export default class UserTurnView {
  constructor(ctx) {
    this._ctx = ctx;
  }

  render(m) {
    const t = Dom.el('div', 'cm-turn user');
    if (m.id) t.dataset.msgId = m.id;
    this._appendTextAndCards(t, m);
    this._appendContext(t, m);
    this._appendImages(t, m);
    t.insertAdjacentHTML('beforeend', this._ctx.turnActions.userActionRowHtml(m));
    this._ctx.turns.applyModeExtras(t, m);
    return t;
  }

  adoptId(m) {
    const scroll = this._ctx.els.scroll;
    const turns = scroll ? [...scroll.querySelectorAll('.cm-turn.user:not([data-msg-id])')] : [];
    const t = turns[turns.length - 1];
    if (!t || !m.id) return;
    t.dataset.msgId = m.id;
    const row = t.querySelector(':scope > .cm-actions');
    if (row) row.outerHTML = this._ctx.turnActions.userActionRowHtml(m);
  }

  _appendTextAndCards(t, m) {
    const parsed = AttachmentParser.parse(m.content);
    for (const att of parsed.attachments) {
      if (att.kind !== 'image') t.appendChild(AttachmentCard.create(att));
    }
    if (parsed.text.trim() || !parsed.attachments.length) {
      const b = Dom.el('div', 'cm-user-bubble');
      b.textContent = parsed.text;
      t.appendChild(b);
    }
  }

  _appendContext(t, m) {
    if (!Array.isArray(m.context) || !m.context.length) return;
    const strip = Dom.el('div', 'cm-attachments cm-user-context');
    strip.innerHTML = m.context.map((c) => AttachmentStrip.contextChipHtml(c, false)).join('');
    t.appendChild(strip);
  }

  _appendImages(t, m) {
    const imgs = this._ctx.artifactChips.userImages(m);
    if (!imgs.length) return;
    const box = Dom.el('div', 'cm-user-images');
    for (const im of imgs) box.appendChild(im);
    t.appendChild(box);
  }
}
