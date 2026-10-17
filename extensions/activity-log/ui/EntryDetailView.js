import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import ActivityText from './ActivityText.js';

export default class EntryDetailView {
  constructor(detailEl) {
    this._el = detailEl;
  }

  showLoading() {
    this._el.innerHTML = '<div class="al-placeholder">Loading...</div>';
  }

  showError() {
    this._el.innerHTML = '<div class="luma-error">Failed to load entry.</div>';
  }

  render(entry) {
    const esc = HtmlEscaper.escape;
    const dur = entry.durationMs != null ? ActivityText.duration(entry.durationMs) : 'n/a';
    const start = new Date(entry.tsStart).toLocaleString();
    this._el.innerHTML = `
        <div class="al-detail-head">
          <span class="al-entry-result ${ActivityText.resultClass(entry.result)}">${esc(entry.result || 'info')}</span>
          <strong class="al-detail-title">${esc(entry.action)}</strong>
        </div>
        <div class="al-detail-meta">${esc(entry.caller)} · ${esc(start)} · ${esc(dur)}</div>

        ${EntryDetailView._optionalSections(entry)}

        <div class="al-detail-section">
          <div class="al-detail-label">Children (${entry.children ? entry.children.length : 0})</div>
          ${EntryDetailView._childrenHtml(entry.children)}
        </div>

        <div class="al-detail-section">
          <div class="al-detail-label">Details</div>
          <pre>${esc(ActivityText.details(entry.details))}</pre>
        </div>
      `;
  }

  static _optionalSections(entry) {
    return [
      entry.summary ? EntryDetailView._section('Summary', '', entry.summary) : '',
      entry.url ? EntryDetailView._section('URL', ' class="al-detail-mono"', entry.url) : '',
      entry.tabId != null ? EntryDetailView._section('Tab', '', entry.tabId) : '',
      entry.correlation ? EntryDetailView._section('Correlation', ' class="al-detail-mono"', entry.correlation) : '',
    ].join('\n\n        ');
  }

  static _section(label, valueAttrs, value) {
    return `
          <div class="al-detail-section">
            <div class="al-detail-label">${label}</div>
            <div${valueAttrs}>${HtmlEscaper.escape(value)}</div>
          </div>`;
  }

  static _childrenHtml(children) {
    if (!children || !children.length) return '<div class="al-placeholder">No child entries.</div>';
    const esc = HtmlEscaper.escape;
    return children.map((c) => `
            <div class="al-detail-child">
              <span class="al-entry-result ${ActivityText.resultClass(c.result)}">${esc(c.result || 'info')}</span>
              <strong>${esc(c.action)}</strong>
              ${c.durationMs != null ? `<span class="al-detail-child-dur"> · ${ActivityText.duration(c.durationMs)}</span>` : ''}
              ${c.summary ? `<div class="al-detail-child-summary">${esc(c.summary)}</div>` : ''}
            </div>
          `).join('');
  }
}
