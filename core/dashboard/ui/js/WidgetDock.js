import HtmlEscaper from '../../../llm-server/ui/js/format/HtmlEscaper.js';
import DashboardGrid from './DashboardGrid.js';
import WidgetCatalog from './WidgetCatalog.js';

export default class WidgetDock {
  static EXTENSIONS_HEADING = 'From extensions';

  constructor({ doc, catalog, grid, onAdd }) {
    this._doc = doc;
    this._catalog = catalog;
    this._grid = grid;
    this._onAdd = onAdd;
  }

  render() {
    const list = this._doc.getElementById('dbDockList');
    if (!list) return;
    list.innerHTML = '';
    const visible = this._catalog.visibleEntries();
    const hidden = this._catalog.hiddenEntries();
    this._renderEmptyNote(list, visible);
    this._renderRows(list, visible, false);
    if (this._catalog.showHidden) this._renderRows(list, hidden, true);
    this._renderHiddenToggle(hidden.length);
    this.syncPlaced();
    this._grid.armDragIn();
  }

  toggleShowHidden() {
    this._catalog.showHidden = !this._catalog.showHidden;
    this.render();
  }

  syncPlaced() {
    const placed = this._grid.placedIds();
    this._doc.querySelectorAll('.db-dock-item').forEach((el) => {
      const isPlaced = placed.has(el.getAttribute('data-root-id'));
      el.classList.toggle('db-placed', isPlaced);
      const state = el.querySelector('.db-dock-state');
      if (state && isPlaced) state.textContent = 'On board';
      else if (state && !el.classList.contains('db-hidden')) state.textContent = '';
      if (isPlaced) el.title = 'Already on the dashboard';
      const addBtn = el.querySelector('.db-dock-add');
      if (addBtn) addBtn.hidden = isPlaced;
    });
  }

  _renderRows(list, entries, isHidden) {
    const live = entries.filter(([, meta]) => meta.kind !== WidgetCatalog.KIND_EXTENSION);
    const ext = entries.filter(([, meta]) => meta.kind === WidgetCatalog.KIND_EXTENSION);
    for (const [rootId, meta] of live) list.appendChild(this._row(rootId, meta, isHidden));
    if (!ext.length) return;
    list.appendChild(this._heading(WidgetDock.EXTENSIONS_HEADING + (isHidden ? ' (hidden)' : '')));
    for (const [rootId, meta] of ext) list.appendChild(this._row(rootId, meta, isHidden));
  }

  _heading(text) {
    const h = this._doc.createElement('div');
    h.className = 'db-dock-section';
    h.textContent = text;
    return h;
  }

  _renderEmptyNote(list, visible) {
    if (visible.length || this._catalog.showHidden) return;
    const p = this._doc.createElement('p');
    p.className = 'db-dock-empty';
    p.textContent = this._catalog.size
      ? 'Every widget is hidden. Use the Hidden button below to bring one back.'
      : 'No widgets yet. Ask the chat to build a live module, e.g. "make me a task tracker widget", or enable an extension that offers dashboard widgets (such as the Hub).';
    list.appendChild(p);
  }

  _renderHiddenToggle(hiddenCount) {
    const toggle = this._doc.getElementById('dbHiddenToggle');
    if (!toggle) return;
    toggle.hidden = hiddenCount === 0;
    toggle.textContent = (this._catalog.showHidden ? 'Hide hidden widgets' : 'Show hidden') + ' (' + hiddenCount + ')';
  }

  _row(rootId, meta, isHidden) {
    const item = this._doc.createElement('div');
    item.className = 'db-dock-item' + (isHidden ? ' db-hidden' : '') + (meta.kind === WidgetCatalog.KIND_EXTENSION ? ' db-dock-ext' : '');
    item.setAttribute('data-root-id', rootId);
    item.setAttribute('gs-w', String(meta.w || DashboardGrid.DEFAULT_W));
    item.setAttribute('gs-h', String(meta.h || DashboardGrid.DEFAULT_H));
    item.title = isHidden ? (meta.title || 'Widget') : 'Drag onto the grid, or use Add';
    item.innerHTML = WidgetDock._rowHtml(meta, isHidden);
    this._wireRow(item, rootId, isHidden);
    return item;
  }

  _wireRow(item, rootId, isHidden) {
    const addBtn = item.querySelector('.db-dock-add');
    if (addBtn) {
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._onAdd(rootId);
      });
    }
    item.querySelector('.db-dock-hide').addEventListener('click', async (e) => {
      e.stopPropagation();
      await this._catalog.setHidden(rootId, !isHidden);
      this.render();
    });
  }

  static _rowHtml(meta, isHidden) {
    const fallback = meta.kind === WidgetCatalog.KIND_EXTENSION ? 'Extension widget' : 'Live module';
    return '<span class="db-dock-title">' + HtmlEscaper.escape(meta.title || fallback) + '</span>'
      + '<span class="db-dock-state">' + (isHidden ? 'Hidden' : '') + '</span>'
      + (isHidden ? '' : '<button class="db-ghost db-dock-add" type="button" title="Add to the dashboard">Add</button>')
      + '<button class="db-ghost db-dock-hide" type="button" title="'
      + (isHidden ? 'Show this widget in the dock again' : 'Hide this widget from the dock')
      + '">' + (isHidden ? 'Show' : 'Hide') + '</button>';
  }
}
