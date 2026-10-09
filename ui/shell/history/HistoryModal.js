import Dialogs from '../../../core/llm-server/ui/js/dialogs/Dialogs.js';
import HistoryDayLabel from './HistoryDayLabel.js';

export default class HistoryModal {
  static LIMIT = 500;

  static SEARCH_DEBOUNCE_MS = 150;

  static DELETE_ICON = '<svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true"><path d="M3.5 3.5l7 7m0-7l-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>';

  constructor({ favicons, tabActions, bounds, clearCache }) {
    this._favicons = favicons;
    this._tabActions = tabActions;
    this._bounds = bounds;
    this._clearCache = clearCache;
    this._debounce = null;
  }

  install() {
    document.getElementById('historyCloseBtn')?.addEventListener('click', () => this.close());
    document.getElementById('historyClearBtn')?.addEventListener('click', () => this.clearRange());
    document.getElementById('historyClearCacheBtn')?.addEventListener('click', () => this._clearCache());
    document.getElementById('historySearch')?.addEventListener('input', (e) => {
      clearTimeout(this._debounce);
      const v = e.target.value;
      this._debounce = setTimeout(() => this.render(v), HistoryModal.SEARCH_DEBOUNCE_MS);
    });
    document.getElementById('historyModal')?.addEventListener('mousedown', (e) => {
      if (e.target.id === 'historyModal') this.close();
    });
  }

  isOpen() {
    const modal = document.getElementById('historyModal');
    return !!modal && !modal.hidden;
  }

  open() {
    const modal = document.getElementById('historyModal');
    if (!modal) return;
    modal.hidden = false;
    const search = document.getElementById('historySearch');
    if (search) search.value = '';
    this.render('');
    this._bounds.queue();
    if (search) search.focus();
  }

  close() {
    const modal = document.getElementById('historyModal');
    if (modal) modal.hidden = true;
    this._bounds.queue();
  }

  toggle() {
    const modal = document.getElementById('historyModal');
    if (!modal) return;
    if (modal.hidden) this.open(); else this.close();
  }

  refresh() {
    this.render(document.getElementById('historySearch')?.value || '');
  }

  async render(search) {
    const list = document.getElementById('historyList');
    if (!list || !window.historyAPI) return;
    let rows = [];
    try { rows = await window.historyAPI.list({ search: search || '', limit: HistoryModal.LIMIT }); }
    catch (e) { console.warn('history list failed:', e.message); }
    list.innerHTML = '';
    if (!rows.length) {
      list.appendChild(HistoryModal._empty(search ? 'No matching history.' : 'No browsing history yet.'));
      return;
    }
    this._appendGrouped(list, rows);
  }

  async clearRange() {
    const range = document.getElementById('historyClearRange');
    const { since, label } = HistoryModal.rangeFor(range ? range.value : 'all');
    const ok = await Dialogs.confirm(`Clear ${label}? This cannot be undone.`, { title: 'Clear history', okLabel: 'Clear', danger: true });
    if (!ok) return;
    await window.historyAPI.clear(since ? { since } : {});
    this.refresh();
  }

  static rangeFor(mode, now = Date.now()) {
    if (mode === 'hour') return { since: new Date(now - 3600000).toISOString(), label: 'history from the last hour' };
    if (mode === 'today') {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return { since: d.toISOString(), label: "today's history" };
    }
    return { since: undefined, label: 'all browsing history' };
  }

  _appendGrouped(list, rows) {
    let lastDay = '';
    for (const row of rows) {
      const d = new Date(row.visitedAt);
      const dayKey = d.toDateString();
      if (dayKey !== lastDay) {
        lastDay = dayKey;
        const h = document.createElement('div');
        h.className = 'bd-day-group';
        h.textContent = HistoryDayLabel.format(d);
        list.appendChild(h);
      }
      list.appendChild(this._row(row, d));
    }
  }

  _row(row, d) {
    const el = document.createElement('div');
    el.className = 'bd-history-row';
    el.append(this._favicons.element(row.url, row.title));
    const main = document.createElement('div');
    main.className = 'bd-row-main';
    main.append(HistoryModal._span('bd-row-title', row.title || row.url), HistoryModal._span('bd-row-url', row.url));
    main.addEventListener('click', () => { this._tabActions.navigate(row.url); this.close(); });
    const time = HistoryModal._span('bd-row-time', d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }));
    el.append(main, time, HistoryModal._deleteButton(row, el));
    return el;
  }

  static _deleteButton(row, rowEl) {
    const del = document.createElement('button');
    del.className = 'bd-row-del';
    del.innerHTML = HistoryModal.DELETE_ICON;
    del.title = 'Remove from history';
    del.addEventListener('click', async (e) => {
      e.stopPropagation();
      await window.historyAPI.delete(row.id);
      rowEl.remove();
    });
    return del;
  }

  static _span(cls, text) {
    const el = document.createElement('span');
    el.className = cls;
    el.textContent = text;
    return el;
  }

  static _empty(text) {
    const el = document.createElement('div');
    el.className = 'bd-empty';
    el.textContent = text;
    return el;
  }
}
