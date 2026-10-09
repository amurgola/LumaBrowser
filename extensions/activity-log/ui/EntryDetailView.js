import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import ActivityText from './ActivityText.js';

export default class EntryDetailView {
  constructor(detailEl) {
    this._el = detailEl;
  }

  showLoading() {
    this._el.innerHTML = '<div style="opacity:0.5;">Loading...</div>';
  }

  showError() {
    this._el.innerHTML = '<div class="luma-error">Failed to load entry.</div>';
  }

  render(entry) {
    const esc = HtmlEscaper.escape;
    const dur = entry.durationMs != null ? ActivityText.duration(entry.durationMs) : 'n/a';
    const start = new Date(entry.tsStart).toLocaleString();
    this._el.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
          <span class="al-entry-result ${ActivityText.resultClass(entry.result)}">${esc(entry.result || 'info')}</span>
          <strong style="font-size:14px;">${esc(entry.action)}</strong>
        </div>
        <div style="opacity:0.7; font-size:12px;">${esc(entry.caller)} · ${esc(start)} · ${esc(dur)}</div>

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
      entry.url ? EntryDetailView._section('URL', ' style="font-family:monospace; font-size:11px; word-break:break-all;"', entry.url) : '',
      entry.tabId != null ? EntryDetailView._section('Tab', '', entry.tabId) : '',
      entry.correlation ? EntryDetailView._section('Correlation', ' style="font-family:monospace; font-size:11px;"', entry.correlation) : '',
    ].join('\n\n        ');
  }

  static _section(label, valueStyle, value) {
    return `
          <div class="al-detail-section">
            <div class="al-detail-label">${label}</div>
            <div${valueStyle}>${HtmlEscaper.escape(value)}</div>
          </div>`;
  }

  static _childrenHtml(children) {
    if (!children || !children.length) return '<div style="opacity:0.5; font-style:italic;">No child entries.</div>';
    const esc = HtmlEscaper.escape;
    return children.map((c) => `
            <div class="al-detail-child">
              <span class="al-entry-result ${ActivityText.resultClass(c.result)}" style="margin-right:6px;">${esc(c.result || 'info')}</span>
              <strong>${esc(c.action)}</strong>
              ${c.durationMs != null ? `<span style="opacity:0.6; font-family:monospace;"> · ${ActivityText.duration(c.durationMs)}</span>` : ''}
              ${c.summary ? `<div style="opacity:0.75; margin-top:2px;">${esc(c.summary)}</div>` : ''}
            </div>
          `).join('');
  }
}
