import Dom from '../dom/Dom.js';
import ChatExtStyles from './ChatExtStyles.js';

export default class QuickPrompt {
  static open(title) {
    return new Promise((resolve) => {
      ChatExtStyles.ensure();
      const back = Dom.el('div', 'luma-modal-overlay');
      const textarea = Dom.el('textarea');
      const close = (value) => { back.remove(); resolve(value); };
      back.appendChild(QuickPrompt._card(title, textarea, close));
      document.body.appendChild(back);
      back.addEventListener('click', (e) => { if (e.target === back) close(null); });
      setTimeout(() => textarea.focus(), 0);
    });
  }

  static _card(title, textarea, close) {
    const card = Dom.el('div', 'luma-modal');
    card.style.width = 'min(460px,92vw)';
    const head = Dom.el('div', 'luma-modal-head');
    head.appendChild(Dom.el('div', 'luma-modal-title', title || 'Enter text'));
    card.appendChild(head);
    const body = Dom.el('div', 'luma-modal-body luma-field');
    body.appendChild(textarea);
    card.appendChild(body);
    card.appendChild(QuickPrompt._foot(textarea, close));
    return card;
  }

  static _foot(textarea, close) {
    const foot = Dom.el('div', 'luma-modal-foot');
    const cancel = Dom.el('button', 'luma-btn', 'Cancel');
    cancel.type = 'button';
    const ok = Dom.el('button', 'luma-btn primary', 'OK');
    ok.type = 'button';
    cancel.addEventListener('click', () => close(null));
    ok.addEventListener('click', () => close(textarea.value.trim() || null));
    foot.appendChild(cancel);
    foot.appendChild(ok);
    return foot;
  }
}
