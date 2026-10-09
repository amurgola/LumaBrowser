import Dom from '../../dom/Dom.js';
import AttachmentParser from '../../markdown/AttachmentParser.js';

export default class UserTurnEditor {
  static MIN_PX = 44;

  static MAX_PX = 320;

  constructor(ctx) {
    this._ctx = ctx;
  }

  edit(m, turnEl) {
    if (this._ctx.state.streaming || !turnEl || turnEl.querySelector('.cm-edit-box')) return;
    const ui = UserTurnEditor._buildBox(AttachmentParser.parse(m.content).text);
    const hidden = [...turnEl.querySelectorAll('.cm-user-bubble, .cm-actions')];
    hidden.forEach((n) => { n.style.display = 'none'; });
    turnEl.appendChild(ui.box);
    const close = () => { ui.box.remove(); hidden.forEach((n) => { n.style.display = ''; }); };
    this._wire(ui, close, () => this._send(m, ui));
    UserTurnEditor._grow(ui.ta);
    ui.ta.focus();
    ui.ta.setSelectionRange(ui.ta.value.length, ui.ta.value.length);
    ui.box.scrollIntoView({ block: 'nearest' });
  }

  static _buildBox(original) {
    const box = Dom.el('div', 'cm-edit-box cm-user-edit');
    const ta = document.createElement('textarea');
    ta.className = 'cm-edit-ta';
    ta.value = original;
    ta.spellcheck = true;
    const row = Dom.el('div', 'cm-edit-row');
    const hint = Dom.el('span', 'cm-edit-hint', 'Sending starts a new branch. The original stays in the pager.');
    const cancel = Dom.el('button', 'cm-modal-btn cm-edit-cancel', 'Cancel');
    cancel.type = 'button';
    const send = Dom.el('button', 'cm-modal-btn primary cm-edit-save', 'Send');
    send.type = 'button';
    row.appendChild(hint);
    row.appendChild(cancel);
    row.appendChild(send);
    box.appendChild(ta);
    box.appendChild(row);
    return { box, ta, hint, cancel, send, original };
  }

  _wire(ui, close, send) {
    ui.ta.addEventListener('input', () => UserTurnEditor._grow(ui.ta));
    ui.cancel.addEventListener('click', close);
    ui.send.addEventListener('click', send);
    ui.ta.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
      else if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
  }

  static _grow(ta) {
    ta.style.height = 'auto';
    ta.style.height = Math.min(Math.max(ta.scrollHeight, UserTurnEditor.MIN_PX), UserTurnEditor.MAX_PX) + 'px';
  }

  _send(m, ui) {
    const next = ui.ta.value.trim();
    if (!next) { ui.ta.focus(); return; }
    ui.send.disabled = true;
    ui.cancel.disabled = true;
    this._ctx.sender.resend(m, next);
  }
}
