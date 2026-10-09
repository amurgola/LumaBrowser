class ListRowLedger {
  constructor() {
    this._seen = new Map();
    this._sequence = 0;
    this._previousKeys = new Set();
    this._removed = false;
  }

  get size() {
    return this._seen.size;
  }

  get virtualized() {
    return this._removed;
  }

  absorb(step) {
    const keys = new Set();
    let added = 0;
    for (const item of step.items) {
      keys.add(item.key);
      if (this._seen.has(item.key)) continue;
      this._seen.set(item.key, { order: item.order, fields: item.fields, seq: this._sequence++ });
      added++;
    }
    this._noteRemovals(keys);
    return added;
  }

  rows() {
    const rows = [...this._seen.values()];
    if (rows.length && rows.every((r) => r.order != null)) return rows.sort((a, b) => a.order - b.order);
    return rows.sort((a, b) => a.seq - b.seq);
  }

  _noteRemovals(keys) {
    for (const key of this._previousKeys) {
      if (!keys.has(key)) {
        this._removed = true;
        break;
      }
    }
    this._previousKeys = keys;
  }
}

module.exports = ListRowLedger;
