export default class DashboardGrid {
  static DEFAULT_W = 4;
  static DEFAULT_H = 3;
  static DOCK_DRAG_SELECTOR = '.db-dock-item:not(.db-placed):not(.db-hidden)';

  static OPTIONS = {
    float: true,
    column: 12,
    cellHeight: '6rem',
    minRow: 1,
    margin: 5,
    alwaysShowResizeHandle: true,
    animate: true,
    acceptWidgets: '.db-dock-item',
    draggable: { handle: '.db-card-head' },
  };

  constructor(GridStack) {
    this._GridStack = GridStack;
    this._grid = null;
  }

  init() {
    this._grid = this._GridStack.init({ ...DashboardGrid.OPTIONS, draggable: { ...DashboardGrid.OPTIONS.draggable } });
    return this;
  }

  on(event, handler) {
    if (this._grid) this._grid.on(event, handler);
  }

  isReady() {
    return !!this._grid;
  }

  placedIds() {
    return new Set(this._nodes().map((n) => String(n.id || '')).filter(Boolean));
  }

  isPlaced(rootId) {
    return this._nodes().some((n) => String(n.id || '') === rootId);
  }

  isEmpty() {
    return this._nodes().length === 0;
  }

  add(rootId, card, pos) {
    const item = card.ownerDocument.createElement('div');
    item.className = 'grid-stack-item';
    item.setAttribute('gs-id', rootId);
    item.appendChild(card);
    this._grid.el.appendChild(item);
    this._grid.makeWidget(item, DashboardGrid._widgetOptions(rootId, pos));
  }

  removeCard(cardEl) {
    const item = cardEl.closest('.grid-stack-item');
    if (item && this._grid) this._grid.removeWidget(item);
  }

  discardDropped(el) {
    try { this._grid.removeWidget(el, true, false); } catch (_) {}
  }

  setStatic(isStatic) {
    if (!this._grid) return;
    try { this._grid.setStatic(isStatic); } catch (_) {}
  }

  layoutItems() {
    if (!this._grid) return null;
    return this._grid.save(false)
      .filter((n) => n && n.id)
      .map((n) => ({ rootId: String(n.id), x: n.x || 0, y: n.y || 0, w: n.w || DashboardGrid.DEFAULT_W, h: n.h || DashboardGrid.DEFAULT_H }));
  }

  armDragIn() {
    if (!this._GridStack) return;
    this._GridStack.setupDragIn(DashboardGrid.DOCK_DRAG_SELECTOR, { appendTo: 'body', helper: 'clone' });
  }

  _nodes() {
    return this._grid ? this._grid.engine.nodes : [];
  }

  static _widgetOptions(rootId, pos) {
    const hasX = !!(pos && Number.isFinite(pos.x));
    return {
      id: rootId,
      x: hasX ? pos.x : undefined,
      y: pos && Number.isFinite(pos.y) ? pos.y : undefined,
      w: (pos && pos.w) || DashboardGrid.DEFAULT_W,
      h: (pos && pos.h) || DashboardGrid.DEFAULT_H,
      autoPosition: !hasX,
    };
  }
}
