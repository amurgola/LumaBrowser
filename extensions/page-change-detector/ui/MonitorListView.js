import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import ExtIcons from '../../ui-kit/ui/ExtIcons.js';
import MonitorHistoryMarkup from './MonitorHistoryMarkup.js';
import MonitorText from './MonitorText.js';

export default class MonitorListView {
  static INLINE_HISTORY_LIMIT = 10;

  constructor(root, invoke, actions) {
    this._invoke = invoke;
    this._actions = actions;
    this._monitors = [];
    this._expandedId = null;
    this._countEl = root.querySelector('#ext-pcd-barCount');
    this._statusEl = root.querySelector('#ext-pcd-barStatus');
    this._listEl = root.querySelector('#ext-pcd-barMonitorList');
  }

  get expandedId() {
    return this._expandedId;
  }

  collapse(id) {
    if (this._expandedId === id) this._expandedId = null;
  }

  render(monitors) {
    this._monitors = monitors;
    this.updateSummary();
    this._renderRows();
  }

  updateSummary() {
    if (!this._countEl) return;
    MonitorListView._setText(this._countEl, MonitorText.panelCount(this._monitors));
    if (this._statusEl) MonitorListView._setText(this._statusEl, MonitorText.panelStatus(this._monitors));
  }

  tick() {
    this.updateSummary();
    if (!this._listEl) return;
    for (const m of this._monitors) {
      const meta = this._listEl.querySelector(`.luma-dockpanel-row[data-monitor-id="${m.id}"] .luma-dockpanel-rowmeta`);
      if (meta) meta.textContent = MonitorText.meta(m);
    }
  }

  toggleHistory(monitorId) {
    this._expandedId = this._expandedId === monitorId ? null : monitorId;
    this._renderRows();
  }

  async loadInlineHistory(monitorId) {
    const container = this._listEl?.querySelector(`[data-history-for="${monitorId}"]`);
    if (!container) return;
    container.innerHTML = '<div class="luma-muted">Loading...</div>';
    try {
      const history = await this._invoke('getHistory', monitorId, MonitorListView.INLINE_HISTORY_LIMIT);
      container.innerHTML = (!history || history.length === 0)
        ? '<div class="luma-empty luma-empty--plain">No checks yet. Click Check to run one now.</div>'
        : MonitorHistoryMarkup.recentList(history);
    } catch (err) {
      container.innerHTML = '<div class="luma-error">Could not load history.</div>';
    }
  }

  _renderRows() {
    const list = this._listEl;
    if (!list) return;
    if (this._monitors.length === 0) {
      list.innerHTML = '<div class="luma-empty">No page monitors yet. Click New monitor and enter a page URL to watch for changes.</div>';
      return;
    }
    list.innerHTML = this._monitors.map((m) => this._rowHtml(m)).join('');
    this._bindRows(list);
    if (this._expandedId) this.loadInlineHistory(this._expandedId);
  }

  _rowHtml(m) {
    const esc = HtmlEscaper.escape;
    const dot = MonitorText.dot(m);
    const open = this._expandedId === m.id;
    const checkingNow = m.status === 'checking';
    return `
          <div class="luma-dockpanel-row is-clickable${open ? ' is-open' : ''}" data-monitor-id="${esc(m.id)}">
            <div class="luma-dockpanel-rowhead">
              <span class="luma-dot ${dot.cls}" title="${esc(dot.title)}"></span>
              <span class="luma-dockpanel-rowname" title="${esc(m.name)}">${esc(m.name)}</span>
              ${MonitorListView._badges(m)}
              <span class="pcd-changes" title="Changes detected">${m.change_count || 0}</span>
              <div class="luma-dockpanel-rowactions">
                <button class="luma-btn luma-btn--sm pcd-check-btn" data-monitor-id="${esc(m.id)}" title="Check now"${checkingNow ? ' disabled' : ''}>${checkingNow ? 'Checking' : 'Check'}</button>
                <button class="luma-btn luma-btn--sm pcd-more-btn" data-monitor-id="${esc(m.id)}" title="More actions" aria-haspopup="menu">${ExtIcons.MORE}</button>
              </div>
            </div>
            <div class="luma-dockpanel-rowmeta" title="${esc(m.url)}"><a href="${esc(m.url)}" data-open-url="${esc(m.url)}">${esc(MonitorText.host(m.url))}</a></div>
            <div class="luma-dockpanel-rowmeta">${esc(MonitorText.meta(m))}</div>
            ${m.last_error ? `<div class="luma-dockpanel-rowerr" title="${esc(m.last_error)}">${esc(m.last_error)}</div>` : ''}
            <div class="luma-dockpanel-detail${open ? '' : ' ext-hidden'}" data-history-for="${esc(m.id)}"></div>
          </div>`;
  }

  static _badges(m) {
    const selCount = Array.isArray(m.selectors) ? m.selectors.length : 0;
    return [
      !m.enabled ? '<span class="luma-badge muted">Paused</span>' : '',
      m.no_refresh_required ? '<span class="luma-badge accent" title="Watches the open tab without reloading">live</span>' : '',
      selCount > 0 ? `<span class="luma-badge info" title="Watching ${selCount} picked element${selCount !== 1 ? 's' : ''}">${selCount} el</span>` : '',
    ].join('');
  }

  _bindRows(list) {
    list.querySelectorAll('.luma-dockpanel-row').forEach((item) => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.luma-dockpanel-rowactions') || e.target.closest('.luma-dockpanel-detail') || e.target.closest('a')) return;
        this.toggleHistory(item.dataset.monitorId);
      });
    });
    list.querySelectorAll('a[data-open-url]').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._actions.onOpenUrl(a.dataset.openUrl);
      });
    });
    list.querySelectorAll('.pcd-check-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); this._actions.onCheck(btn.dataset.monitorId, btn); });
    });
    list.querySelectorAll('.pcd-more-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const m = this._monitors.find((x) => x.id === btn.dataset.monitorId);
        if (m) this._actions.onMore(btn, m);
      });
    });
  }

  static _setText(el, text) {
    if (el.textContent !== text) el.textContent = text;
  }
}
