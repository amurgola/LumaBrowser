import Dom from '../../dom/Dom.js';

export default class ChatModals {
  static confirm(host, message, opts) {
    const o = opts || {};
    const back = Dom.el('div', 'cm-modal-back');
    back.innerHTML = '<div class="cm-modal">'
      + '<div class="cm-modal-msg"></div>'
      + '<div class="cm-modal-actions">'
      + '<button class="cm-modal-btn" data-act="cancel"></button>'
      + '<button class="cm-modal-btn ' + (o.danger ? 'danger' : 'primary') + '" data-act="ok"></button>'
      + '</div></div>';
    back.querySelector('.cm-modal-msg').textContent = message || '';
    back.querySelector('[data-act="cancel"]').textContent = o.cancelLabel || 'Cancel';
    back.querySelector('[data-act="ok"]').textContent = o.confirmLabel || 'Confirm';
    return ChatModals._run(host, back, {
      cancelValue: false,
      okValue: () => true,
      focus: () => back.querySelector('[data-act="ok"]'),
    });
  }

  static prompt(host, title, initial) {
    const back = Dom.el('div', 'cm-modal-back');
    back.innerHTML = '<div class="cm-modal">'
      + '<div class="cm-modal-title"></div>'
      + '<input class="cm-modal-input" type="text" />'
      + '<div class="cm-modal-actions">'
      + '<button class="cm-modal-btn" data-act="cancel">Cancel</button>'
      + '<button class="cm-modal-btn primary" data-act="ok">Save</button>'
      + '</div></div>';
    back.querySelector('.cm-modal-title').textContent = title || '';
    const input = back.querySelector('.cm-modal-input');
    input.value = initial == null ? '' : String(initial);
    return ChatModals._run(host, back, {
      cancelValue: null,
      okValue: () => input.value.trim() || null,
      focus: () => input,
      select: true,
    });
  }

  static _run(host, back, spec) {
    return new Promise((resolve) => {
      let done = false;
      const close = (val) => {
        if (done) return;
        done = true;
        document.removeEventListener('keydown', onKey, true);
        back.remove();
        resolve(val);
      };
      const onKey = (ev) => {
        if (ev.key === 'Escape') { ev.preventDefault(); close(spec.cancelValue); }
        else if (ev.key === 'Enter') { ev.preventDefault(); close(spec.okValue()); }
      };
      back.addEventListener('click', (ev) => ChatModals._onClick(ev, back, spec, close));
      document.addEventListener('keydown', onKey, true);
      (host || document.body).appendChild(back);
      setTimeout(() => ChatModals._focus(spec), 0);
    });
  }

  static _onClick(ev, back, spec, close) {
    if (ev.target === back) { close(spec.cancelValue); return; }
    const act = ev.target.closest('[data-act]');
    if (!act) return;
    close(act.dataset.act === 'ok' ? spec.okValue() : spec.cancelValue);
  }

  static _focus(spec) {
    const target = spec.focus();
    if (!target) return;
    target.focus();
    if (spec.select) target.select();
  }
}
