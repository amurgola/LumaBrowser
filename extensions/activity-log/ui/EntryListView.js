import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import ActivityText from './ActivityText.js';

export default class EntryListView {
  constructor(listEl, onSelect) {
    this._list = listEl;
    this._onSelect = onSelect;
  }

  render(entries, selectedId, loggingOn) {
    if (entries.length === 0) {
      this._list.innerHTML = EntryListView._emptyHtml(loggingOn);
      return;
    }
    this._list.innerHTML = '';
    for (const e of entries) this._list.appendChild(this._row(e, selectedId));
  }

  renderError(message) {
    this._list.innerHTML = `<div class="luma-empty">Error: ${HtmlEscaper.escape(message || 'unknown')}</div>`;
  }

  markSelected(id) {
    this._list.querySelectorAll('.al-entry-row').forEach((r) => {
      r.classList.toggle('al-entry-row--selected', Number(r.dataset.id) === id);
    });
  }

  static _emptyHtml(loggingOn) {
    return `
          <div class="luma-empty" style="padding:20px; text-align:center;">
            No entries yet.${!loggingOn ? '<br><small>Logging is off. Turn on the master switch above to start recording.</small>' : ''}
          </div>`;
  }

  _row(e, selectedId) {
    const esc = HtmlEscaper.escape;
    const row = document.createElement('div');
    row.className = 'al-entry-row' + (e.id === selectedId ? ' al-entry-row--selected' : '');
    row.dataset.id = e.id;
    const time = new Date(e.tsStart).toLocaleTimeString();
    const dur = e.durationMs != null ? ActivityText.duration(e.durationMs) : '';
    row.innerHTML = `
          <span class="al-entry-time">${esc(time)}</span>
          <span class="al-entry-caller" title="${esc(e.caller)}">${esc(ActivityText.shortCaller(e.caller))}</span>
          <span class="al-entry-action" title="${esc(e.action)}">${esc(e.summary || e.action)}</span>
          <span class="al-entry-duration">${esc(dur)}</span>
          <span class="al-entry-result ${ActivityText.resultClass(e.result)}">${esc(e.result || 'info')}</span>
        `;
    row.addEventListener('click', () => this._onSelect(e.id));
    return row;
  }
}
