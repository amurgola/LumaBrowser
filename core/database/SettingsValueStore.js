class SettingsValueStore {
  constructor(db, storageKey) {
    if (!storageKey) throw new Error(`${this.constructor.name} requires a storageKey`);
    this._db = db;
    this._storageKey = storageKey;
  }

  _emptyValue() {
    throw new Error(`${this.constructor.name} must implement _emptyValue()`);
  }

  _hasValidShape(value) {
    throw new Error(`${this.constructor.name} must implement _hasValidShape(value)`);
  }

  _read() {
    const value = this._db.get(this._storageKey, this._emptyValue());
    return this._hasValidShape(value) ? value : this._emptyValue();
  }

  _write(value) {
    this._db.set(this._storageKey, value);
  }
}

module.exports = SettingsValueStore;
