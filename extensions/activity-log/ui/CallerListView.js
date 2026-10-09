import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';

export default class CallerListView {
  static EMPTY_HTML = '<div class="luma-empty">No callers registered yet. Extensions will appear here as they load.</div>';

  constructor(els, onToggle) {
    this._els = els;
    this._onToggle = onToggle;
  }

  render(callers, settings) {
    this._renderCount(callers);
    if (callers.length === 0) {
      this._els.list.innerHTML = CallerListView.EMPTY_HTML;
      return;
    }
    this._renderRows(callers, settings);
    this._bindToggles();
  }

  renderFilter(callers) {
    const filter = this._els.filter;
    const current = filter.value;
    filter.innerHTML = '<option value="">All callers</option>';
    for (const c of callers) {
      const opt = document.createElement('option');
      opt.value = c.caller;
      opt.textContent = `${c.label || c.caller}`;
      filter.appendChild(opt);
    }
    if (current) filter.value = current;
  }

  _renderCount(callers) {
    this._els.count.textContent = `${callers.length} caller${callers.length === 1 ? '' : 's'}`;
  }

  _renderRows(callers, settings) {
    const masterOn = !!(settings && settings.enabled);
    const overrides = (settings && settings.enabledCallers) || {};
    this._els.list.innerHTML = '';
    for (const c of callers) this._els.list.appendChild(CallerListView._row(c, masterOn, overrides[c.caller] !== false));
  }

  static _row(c, masterOn, checked) {
    const esc = HtmlEscaper.escape;
    const row = document.createElement('label');
    row.className = 'al-caller-row' + (masterOn ? '' : ' al-caller-row--disabled');
    row.innerHTML = `
          <div style="flex:1;">
            <span class="al-caller-row-name">${esc(c.label || c.caller)}</span>
            <span class="al-caller-row-id">${esc(c.caller)}</span>
            <span class="al-caller-row-source">${esc(c.source || '')}</span>
            ${c.description ? `<div class="al-caller-row-desc">${esc(c.description)}</div>` : ''}
          </div>
          <span class="luma-switch">
            <input type="checkbox" ${checked ? 'checked' : ''} ${masterOn ? '' : 'disabled'} data-caller="${esc(c.caller)}">
            <span class="luma-switch-track"></span>
          </span>
        `;
    return row;
  }

  _bindToggles() {
    this._els.list.querySelectorAll('input[type="checkbox"][data-caller]').forEach((input) => {
      input.addEventListener('change', (e) => this._onToggle(e.target.dataset.caller, e.target.checked, e.target));
    });
  }
}
