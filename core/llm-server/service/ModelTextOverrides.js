const SettingsMapStore = require('./SettingsMapStore');

class ModelTextOverrides extends SettingsMapStore {
  get(key) {
    const value = this._read()[key];
    return typeof value === 'string' ? value : '';
  }

  set(key, text) {
    if (!key) return this.all();
    const entries = this.all();
    const clean = typeof text === 'string' ? text.trim() : '';
    if (clean) entries[key] = clean;
    else delete entries[key];
    this._write(entries);
    return entries;
  }
}

module.exports = ModelTextOverrides;
