class DisabledExtensions {
  static SETTING_KEY = 'shell.extensions.disabled';

  constructor(db) {
    this._db = db || null;
    this.set = new Set(this._read());
  }

  has(id) {
    return this.set.has(id);
  }

  add(id) {
    this.set.add(id);
    this._persist();
  }

  remove(id) {
    this.set.delete(id);
    this._persist();
  }

  refresh() {
    if (!this._db) return false;
    const fresh = new Set(this._read());
    const changed = fresh.size !== this.set.size || [...fresh].some((id) => !this.set.has(id));
    if (changed) this.set = fresh;
    return changed;
  }

  _read() {
    return this._db ? this._db.get(DisabledExtensions.SETTING_KEY, []) || [] : [];
  }

  _persist() {
    if (this._db) this._db.set(DisabledExtensions.SETTING_KEY, [...this.set]);
  }
}

module.exports = DisabledExtensions;
