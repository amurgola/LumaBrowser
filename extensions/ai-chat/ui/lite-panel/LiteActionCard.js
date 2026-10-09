export default class LiteActionCard {
  static DETAIL_MAX = 200;
  static TAKEOVER_FALLBACK = 'The page needs you (a login or verification step).';

  static build(tool, { api, answered, onAnswer }) {
    const card = LiteActionCard._el('div', 'ai-lite-card');
    const title = document.createElement('b');
    const det = LiteActionCard._el('span', 'ai-lite-card-det');
    const actions = LiteActionCard._el('div', 'ai-lite-card-actions');
    const spec = tool.status === 'approval' ? LiteActionCard._approval(tool, api) : LiteActionCard._takeover(tool, api);
    title.textContent = spec.title;
    det.textContent = spec.detail.slice(0, LiteActionCard.DETAIL_MAX);
    for (const [label, primary, send] of spec.buttons) {
      actions.appendChild(LiteActionCard._button(label, primary, answered, () => {
        onAnswer();
        actions.querySelectorAll('button').forEach((b) => { b.disabled = true; });
        return send();
      }));
    }
    card.appendChild(title);
    card.appendChild(det);
    card.appendChild(actions);
    return card;
  }

  static _approval(tool, api) {
    return {
      title: 'Approve this?',
      detail: String(tool.detail || tool.tool || ''),
      buttons: [
        ['Allow once', true, () => api.chat.approvalRespond('once')],
        ['Allow for this run', false, () => api.chat.approvalRespond('run')],
        ['Decline', false, () => api.chat.approvalRespond('reject')],
      ],
    };
  }

  static _takeover(tool, api) {
    return {
      title: 'Needs you',
      detail: (tool.params && tool.params.reason) ? String(tool.params.reason) : LiteActionCard.TAKEOVER_FALLBACK,
      buttons: [
        ['I did it, continue', true, () => api.chat.takeoverRespond('continue')],
        ['Skip this step', false, () => api.chat.takeoverRespond('skip')],
      ],
    };
  }

  static _button(label, primary, disabled, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'luma-btn' + (primary ? ' primary' : '');
    b.textContent = label;
    b.disabled = disabled;
    b.addEventListener('click', async () => {
      try { await onClick(); } catch (_) {}
    });
    return b;
  }

  static _el(tag, className) {
    const el = document.createElement(tag);
    el.className = className;
    return el;
  }
}
