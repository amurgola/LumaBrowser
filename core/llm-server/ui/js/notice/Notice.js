import ChatIcons from '../chat/ChatIcons.js';

export default class Notice {
  static KINDS = ['info', 'ok', 'warn', 'bad'];

  static DISMISS_LABEL = 'Dismiss';

  static render(notice, onDismiss = null) {
    const kind = Notice.kindOf(notice && notice.kind);
    const box = Notice._el('div', `luma-callout luma-notice ${kind}`);
    box.setAttribute('role', kind === 'bad' ? 'alert' : 'status');
    box.appendChild(Notice._body(notice || {}));
    const controls = Notice.controls(notice && notice.action, onDismiss);
    if (controls) box.appendChild(controls);
    return box;
  }

  static kindOf(kind) {
    return Notice.KINDS.includes(kind) ? kind : 'info';
  }

  static controls(action, onDismiss) {
    const hasAction = !!(action && typeof action.run === 'function');
    if (!hasAction && typeof onDismiss !== 'function') return null;
    const controls = Notice._el('div', 'luma-notice-controls');
    if (hasAction) controls.appendChild(Notice.actionButton(action));
    if (typeof onDismiss === 'function') controls.appendChild(Notice.closeButton(onDismiss));
    return controls;
  }

  static actionButton(action) {
    const button = Notice._el('button', 'luma-btn luma-btn--sm luma-notice-action', String(action.label || 'Open'));
    button.type = 'button';
    button.addEventListener('click', () => action.run());
    return button;
  }

  static closeButton(onDismiss, label = Notice.DISMISS_LABEL) {
    const button = Notice._el('button', 'luma-notice-x');
    button.type = 'button';
    button.setAttribute('aria-label', label);
    button.title = label;
    button.innerHTML = ChatIcons.x;
    button.addEventListener('click', () => onDismiss());
    return button;
  }

  static _body(notice) {
    const body = Notice._el('div', 'luma-notice-body');
    if (notice.title) body.appendChild(Notice._el('div', 'luma-notice-title', notice.title));
    for (const line of Notice._lines(notice)) body.appendChild(Notice._el('div', 'luma-notice-line', line));
    return body;
  }

  static _lines(notice) {
    const lines = Array.isArray(notice.lines) ? notice.lines : [];
    return (notice.text ? [notice.text] : []).concat(lines).filter((line) => line != null && String(line) !== '');
  }

  static _el(tag, className, text) {
    const el = document.createElement(tag);
    el.className = className;
    if (text != null) el.textContent = String(text);
    return el;
  }
}
