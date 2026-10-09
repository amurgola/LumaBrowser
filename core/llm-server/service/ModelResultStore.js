const SettingsMapStore = require('./SettingsMapStore');

class ModelResultStore extends SettingsMapStore {
  get(modelPath) {
    if (!modelPath) return null;
    return this._read()[modelPath] || null;
  }

  save(modelPath, entry) {
    if (!modelPath || !this._isWorthKeeping(entry)) return this.get(modelPath);
    const entries = this.all();
    entries[modelPath] = this._toRecord(entry);
    this._write(entries);
    return entries[modelPath];
  }

  _isWorthKeeping(entry) {
    throw new Error(`${this.constructor.name} must implement _isWorthKeeping(entry)`);
  }

  _toRecord(entry) {
    throw new Error(`${this.constructor.name} must implement _toRecord(entry)`);
  }

  static _ranAt(entry) {
    return entry.ranAt || new Date().toISOString();
  }
}

module.exports = ModelResultStore;
