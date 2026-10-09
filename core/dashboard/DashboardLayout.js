class DashboardLayout {
  static LAYOUT_KEY = 'core.dashboard.layout';
  static HIDDEN_KEY = 'core.dashboard.hiddenWidgets';
  static GRID_COLUMNS = 12;
  static NEW_ITEM = { x: 0, w: 4, h: 3 };

  constructor(settingsDb) {
    this._settings = settingsDb;
  }

  get() {
    const value = this._settings.get(DashboardLayout.LAYOUT_KEY, []);
    return Array.isArray(value) ? value : [];
  }

  set(items) {
    const clean = (Array.isArray(items) ? items : []).filter(DashboardLayout._hasRootId).map(DashboardLayout._clampItem);
    this._settings.set(DashboardLayout.LAYOUT_KEY, clean);
    return clean;
  }

  pin(rootId) {
    const rid = String(rootId || '').trim();
    const layout = this.get();
    if (!rid || layout.some((it) => it.rootId === rid)) return { added: false, layout };
    const item = { rootId: rid, x: DashboardLayout.NEW_ITEM.x, y: DashboardLayout._bottomOf(layout), w: DashboardLayout.NEW_ITEM.w, h: DashboardLayout.NEW_ITEM.h };
    return { added: true, item, layout: this.set([...layout, item]) };
  }

  hiddenWidgets() {
    const value = this._settings.get(DashboardLayout.HIDDEN_KEY, []);
    return Array.isArray(value) ? value.filter((x) => typeof x === 'string' && x) : [];
  }

  setHidden(rootId, hidden) {
    const id = String(rootId || '').trim();
    if (!id) return this.hiddenWidgets();
    const set = new Set(this.hiddenWidgets());
    if (hidden) set.add(id); else set.delete(id);
    const list = [...set];
    this._settings.set(DashboardLayout.HIDDEN_KEY, list);
    return list;
  }

  static _hasRootId(item) {
    return !!item && typeof item.rootId === 'string' && !!item.rootId;
  }

  static _clampItem(item) {
    const last = DashboardLayout.GRID_COLUMNS;
    return {
      rootId: item.rootId,
      x: DashboardLayout._clampInt(item.x, 0, last - 1, 0),
      y: DashboardLayout._clampInt(item.y, 0, 9999, 0),
      w: DashboardLayout._clampInt(item.w, 1, last, DashboardLayout.NEW_ITEM.w),
      h: DashboardLayout._clampInt(item.h, 1, 99, DashboardLayout.NEW_ITEM.h),
    };
  }

  static _bottomOf(layout) {
    return layout.reduce((max, it) => Math.max(max, (it.y || 0) + (it.h || DashboardLayout.NEW_ITEM.h)), 0);
  }

  static _clampInt(value, min, max, fallback) {
    const n = parseInt(value, 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }
}

module.exports = DashboardLayout;
