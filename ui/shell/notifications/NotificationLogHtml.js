import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';

export default class NotificationLogHtml {
  static CLOSE_ICON = '<svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true"><path d="M3.5 3.5l7 7m0-7l-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>';

  static render(entries, autoCloseMs) {
    const esc = HtmlEscaper.escape;
    const items = entries.map((e) => (
      `<div class="log-item ${e.type === 'success' || e.type === 'error' ? e.type : ''}">${esc(e.time)}: ${esc(e.message)}</div>`
    )).join('');
    return `<div class="notification-log" style="--nlog-ms:${autoCloseMs}ms">`
      + '<svg class="nlog-ring" aria-hidden="true"><rect pathLength="100"/></svg>'
      + '<div class="log-title"><span>Notifications</span>'
      + `<button class="log-close-btn" data-bd-action="close-log" title="Dismiss">${NotificationLogHtml.CLOSE_ICON}</button></div>`
      + `<div class="log-items">${items}</div></div>`;
  }
}
