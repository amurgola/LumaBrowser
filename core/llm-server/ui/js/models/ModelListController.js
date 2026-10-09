export default class ModelListController {
  constructor(resonant, ns) {
    this._resonant = resonant;
    this.ns = ns;
  }

  set(rows, opts) {
    const list = Array.isArray(rows) ? rows : [];
    if (!opts || opts.preserveExpanded !== false) this._carryExpanded(list);
    const items = this._items();
    if (items) items.update(list);
  }

  patchRow(key, patch) {
    const index = this._indexOf(key);
    if (index < 0 || !patch) return false;
    ModelListController._assign(this._items()[index], patch);
    return true;
  }

  patchAll(fn) {
    const items = this._items();
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const patch = fn(items[i], i);
      if (patch) ModelListController._assign(items[i], patch);
    }
  }

  getRow(key) {
    const index = this._indexOf(key);
    return index >= 0 ? this._items()[index] : null;
  }

  _items() {
    return this._resonant.data[this.ns];
  }

  _indexOf(key) {
    const items = this._items();
    if (!items) return -1;
    for (let i = 0; i < items.length; i++) {
      let rowKey = null;
      try { rowKey = items[i] && items[i].mlKey; } catch (_) { rowKey = null; }
      if (rowKey === key) return i;
    }
    return -1;
  }

  _carryExpanded(list) {
    const wasOpen = new Set();
    const items = this._items();
    if (items) {
      for (let i = 0; i < items.length; i++) {
        try { if (items[i] && items[i].expanded && items[i].mlKey != null) wasOpen.add(items[i].mlKey); } catch (_) {}
      }
    }
    for (const row of list) if (row && wasOpen.has(row.mlKey)) row.expanded = true;
  }

  static _assign(item, patch) {
    for (const key of Object.keys(patch)) item[key] = patch[key];
  }
}
