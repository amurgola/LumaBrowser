import HtmlEscaper from '../../../../core/llm-server/ui/js/format/HtmlEscaper.js';

export default class SitePermissionsPanel {
  static CELL_STYLE = 'color:var(--text-muted);font-size:12px;white-space:nowrap;';

  install() {
    this._api = window.electronAPI && window.electronAPI.sitePermissions;
    this._list = document.getElementById('gsSitePermList');
    this._empty = document.getElementById('gsSitePermEmpty');
    this._clearAll = document.getElementById('gsSitePermClearAll');
    if (!this._api || !this._list) return;
    this._list.addEventListener('click', (e) => this._onRowClick(e));
    if (this._clearAll) this._clearAll.addEventListener('click', () => this._run(() => this._api.clearAll()));
    const secTab = document.querySelector('.settings-tab[data-tab="security"]');
    if (secTab) secTab.addEventListener('click', () => { this.refresh(); });
    this.refresh();
  }

  static answerLabel(v) {
    if (v === 'allow') return 'Allowed';
    if (v === 'block') return 'Blocked';
    return 'Ask';
  }

  static rowsHtml(rows) {
    const esc = HtmlEscaper.escape;
    const cell = SitePermissionsPanel.CELL_STYLE;
    return rows.map((r) => `<div class="gs-ide-row" data-origin="${esc(r.origin)}">`
      + `<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(r.origin)}</span>`
      + `<span style="${cell}">Camera: ${SitePermissionsPanel.answerLabel(r.camera)}</span>`
      + `<span style="${cell}">Microphone: ${SitePermissionsPanel.answerLabel(r.microphone)}</span>`
      + '<button class="gs-action-btn" data-act="clear">Clear</button>'
      + '</div>').join('');
  }

  async refresh() {
    let rows = [];
    try { rows = await this._api.list(); } catch (_) { rows = []; }
    rows = Array.isArray(rows) ? rows : [];
    this._list.innerHTML = SitePermissionsPanel.rowsHtml(rows);
    if (this._empty) this._empty.style.display = rows.length ? 'none' : '';
    if (this._clearAll) this._clearAll.disabled = !rows.length;
  }

  _onRowClick(e) {
    const btn = e.target.closest('button[data-act="clear"]');
    const row = btn && btn.closest('[data-origin]');
    if (!row) return;
    this._run(() => this._api.clear(row.dataset.origin));
  }

  async _run(op) {
    try { await op(); } catch (_) {}
    this.refresh();
  }
}
