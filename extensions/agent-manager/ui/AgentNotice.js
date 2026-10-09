export default class AgentNotice {
  static render(notice, onDismiss) {
    const box = AgentNotice._el('div', 'am-notice' + (notice.kind === 'warn' ? ' warn' : ''));
    const body = AgentNotice._el('div', 'am-notice-body');
    body.appendChild(AgentNotice._el('div', 'am-notice-title', notice.title));
    for (const line of notice.lines || []) body.appendChild(AgentNotice._el('div', 'am-notice-line', line));
    const close = AgentNotice._el('button', 'luma-btn', 'Dismiss');
    close.addEventListener('click', onDismiss);
    box.appendChild(body);
    box.appendChild(close);
    return box;
  }

  static _el(tag, className, text) {
    const el = document.createElement(tag);
    el.className = className;
    if (text != null) el.textContent = text;
    return el;
  }
}
