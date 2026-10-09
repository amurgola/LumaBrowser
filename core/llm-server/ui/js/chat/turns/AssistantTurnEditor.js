import Dom from '../../dom/Dom.js';

export default class AssistantTurnEditor {
  static MIN_PX = 96;

  static MAX_PX = 520;

  constructor(ctx) {
    this._ctx = ctx;
  }

  edit(m, turnEl) {
    if (this._ctx.state.streaming || !turnEl || turnEl.querySelector('.cm-edit-box')) return;
    const asst = turnEl.querySelector('.cm-asst');
    const body = asst && asst.querySelector('.cm-asst-body');
    if (!body) return;
    const ui = AssistantTurnEditor._buildBox(String(m.content || ''));
    const hidden = [body, ...asst.querySelectorAll('.cm-actions, .cm-choices')];
    hidden.forEach((n) => { n.style.display = 'none'; });
    body.insertAdjacentElement('afterend', ui.box);
    const close = () => { ui.box.remove(); hidden.forEach((n) => { n.style.display = ''; }); };
    const save = () => this._save(m, turnEl, ui, close);
    this._wire(ui, close, save);
    AssistantTurnEditor._grow(ui.ta);
    ui.ta.focus();
    ui.ta.setSelectionRange(ui.ta.value.length, ui.ta.value.length);
    ui.box.scrollIntoView({ block: 'nearest' });
  }

  static _buildBox(original) {
    const box = Dom.el('div', 'cm-edit-box');
    const ta = document.createElement('textarea');
    ta.className = 'cm-edit-ta';
    ta.value = original;
    ta.spellcheck = true;
    const row = Dom.el('div', 'cm-edit-row');
    const hint = Dom.el('span', 'cm-edit-hint', 'Editing the reply. The next message continues from this text.');
    const cancel = Dom.el('button', 'cm-modal-btn cm-edit-cancel', 'Cancel');
    cancel.type = 'button';
    const save = Dom.el('button', 'cm-modal-btn primary cm-edit-save', 'Save');
    save.type = 'button';
    row.appendChild(hint);
    row.appendChild(cancel);
    row.appendChild(save);
    box.appendChild(ta);
    box.appendChild(row);
    return { box, ta, hint, cancel, save, original };
  }

  _wire(ui, close, save) {
    ui.ta.addEventListener('input', () => AssistantTurnEditor._grow(ui.ta));
    ui.cancel.addEventListener('click', close);
    ui.save.addEventListener('click', save);
    ui.ta.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); save(); }
    });
  }

  static _grow(ta) {
    ta.style.height = 'auto';
    ta.style.height = Math.min(Math.max(ta.scrollHeight, AssistantTurnEditor.MIN_PX), AssistantTurnEditor.MAX_PX) + 'px';
  }

  async _save(m, turnEl, ui, close) {
    const next = ui.ta.value;
    if (next === ui.original) { close(); return; }
    if (!next.trim()) { ui.ta.focus(); return; }
    ui.save.disabled = true;
    ui.cancel.disabled = true;
    ui.save.textContent = 'Saving…';
    const { ok, err } = await this._persist(m, next);
    if (!ok) { AssistantTurnEditor._showFailure(ui, err); return; }
    m.content = next;
    m.edited = true;
    const fresh = this._ctx.turns.render(m);
    turnEl.replaceWith(fresh);
    this._ctx.modeCtx.callHook('onMessageEdited', m, this._ctx.modeCtx.forHooks());
    fresh.scrollIntoView({ block: 'nearest' });
  }

  async _persist(m, content) {
    try {
      const r = await this._ctx.api.conv.updateMessage(m.id, { content, conversationId: this._ctx.state.activeId });
      return { ok: !!(r && r.success), err: (r && r.error) || '' };
    } catch (e) {
      return { ok: false, err: (e && e.message) || 'save failed' };
    }
  }

  static _showFailure(ui, err) {
    ui.save.disabled = false;
    ui.cancel.disabled = false;
    ui.save.textContent = 'Save';
    ui.hint.textContent = 'Could not save' + (err ? ': ' + err : '') + '.';
    ui.hint.classList.add('bad');
  }
}
