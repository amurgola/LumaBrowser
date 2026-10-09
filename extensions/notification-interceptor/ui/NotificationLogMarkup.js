import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import TimeText from '../../ui-kit/ui/TimeText.js';

export default class NotificationLogMarkup {
  static EMPTY_HTML = '<div class="luma-empty">No notifications captured yet. They appear here as sites send them.</div>';

  static list(entries) {
    if (!entries.length) return NotificationLogMarkup.EMPTY_HTML;
    return entries.map((entry) => NotificationLogMarkup.card(entry)).join('');
  }

  static card(e) {
    const esc = HtmlEscaper.escape;
    const label = NotificationLogMarkup.label(e);
    return `
        <div class="luma-card ni-entry">
          <div class="luma-card-main">
            <div class="luma-card-name">
              <span class="luma-dot ${NotificationLogMarkup.dot(e)}" title="${esc(label)}"></span>
              ${esc(e.title || '(no title)')}
              <span class="luma-badge ${NotificationLogMarkup.badge(e)}">${esc(label)}</span>
            </div>
            ${e.body ? `<div class="luma-card-desc">${esc(e.body)}</div>` : ''}
            <div class="luma-card-desc ni-entry-meta">${NotificationLogMarkup._origin(e)} · ${esc(TimeText.formatTime(e.at))}</div>
            ${e.error ? `<div class="luma-dockpanel-rowerr" style="padding-left:0;">${esc(e.error)}</div>` : ''}
          </div>
        </div>`;
  }

  static dot(e) {
    return NotificationLogMarkup._byForward(e, 'ok', 'bad', '');
  }

  static badge(e) {
    return NotificationLogMarkup._byForward(e, 'ok', 'bad', 'muted');
  }

  static label(e) {
    return NotificationLogMarkup._byForward(e, 'Forwarded', 'Forward failed', 'Not forwarded');
  }

  static _byForward(e, sent, failed, other) {
    if (e.forward === 'sent') return sent;
    if (e.forward === 'failed') return failed;
    return other;
  }

  static _origin(e) {
    const esc = HtmlEscaper.escape;
    return `${esc(e.tabTitle || e.source || '')}${e.tabTitle && e.source ? ` (${esc(e.source)})` : ''}`;
  }
}
