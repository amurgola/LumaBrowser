import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import TimeText from '../../ui-kit/ui/TimeText.js';

export default class WatcherListView {
  static EMPTY_HTML = '<div class="luma-empty">No watchers yet. Add a URL pattern above to capture matching responses and forward them.</div>';

  constructor(listEl, handlers) {
    this._list = listEl;
    this._handlers = handlers;
  }

  render(watchers) {
    if (watchers.length === 0) {
      this._list.innerHTML = WatcherListView.EMPTY_HTML;
      return;
    }
    this._list.innerHTML = watchers.map((w) => WatcherListView._cardHtml(w)).join('');
    this._bindActions();
  }

  static _cardHtml(w) {
    const esc = HtmlEscaper.escape;
    return `
        <div class="luma-card watcher-item" data-watcher-id="${esc(w.id)}">
          <div class="luma-card-main watcher-info">
            <div class="luma-card-name watcher-pattern">
              <span class="luma-dot ${w.enabled ? 'ok' : ''}" title="${w.enabled ? 'Active' : 'Paused'}"></span>
              ${esc(w.urlPattern)}
              ${w.enabled ? '' : '<span class="luma-badge muted">Paused</span>'}
            </div>
            ${w.note ? `<div class="luma-card-desc watcher-note">${esc(w.note)}</div>` : ''}
            <div class="luma-card-desc watcher-details">
              <span>${esc(w.method === '*' ? 'Any method' : w.method)}</span>
              <span class="watcher-sep"></span>
              <span title="${esc(w.sendTo)}">to ${esc(w.sendTo)}</span>
              <span class="watcher-sep"></span>
              <span>${WatcherListView._capturesText(w)}</span>
            </div>
          </div>
          <div class="luma-card-actions">
            <label class="luma-switch" title="${w.enabled ? 'Pause watcher' : 'Resume watcher'}">
              <input type="checkbox" class="nw-toggle" data-watcher-id="${esc(w.id)}" ${w.enabled ? 'checked' : ''}>
              <span class="luma-switch-track"></span>
            </label>
            <button class="luma-btn luma-btn--sm danger nw-delete" data-watcher-id="${esc(w.id)}">Delete</button>
          </div>
        </div>
      `;
  }

  static _capturesText(w) {
    if (!(w.triggerCount > 0)) return 'No captures yet';
    const plural = w.triggerCount !== 1 ? 's' : '';
    return `${w.triggerCount} capture${plural}, last ${HtmlEscaper.escape(TimeText.formatRelative(w.lastTriggered))}`;
  }

  _bindActions() {
    this._list.querySelectorAll('.nw-toggle').forEach((input) => {
      input.addEventListener('change', (e) => this._handlers.onToggle(e.target.dataset.watcherId, e.target.checked));
    });
    this._list.querySelectorAll('.nw-delete').forEach((btn) => {
      btn.addEventListener('click', () => this._handlers.onDelete(btn.dataset.watcherId));
    });
  }
}
