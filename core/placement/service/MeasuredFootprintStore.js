const SettingsValueStore = require('../../database/SettingsValueStore');

class MeasuredFootprintStore extends SettingsValueStore {
  static STORAGE_KEY = 'core.placement.measured';

  constructor(settingsDb) {
    super(settingsDb, MeasuredFootprintStore.STORAGE_KEY);
  }

  all() {
    try { return this._read(); } catch (_) { return this._emptyValue(); }
  }

  merge(entriesByKey) {
    const all = this.all();
    for (const [key, entry] of Object.entries(entriesByKey || {})) {
      if (!key || !entry) continue;
      all[key] = { ...(all[key] || {}), ...entry };
    }
    try { this._write(all); } catch (_) {}
    return all;
  }

  _emptyValue() {
    return {};
  }

  _hasValidShape(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  _read() {
    const raw = this._db.get(this._storageKey, null);
    const value = typeof raw === 'string' ? MeasuredFootprintStore._parse(raw) : raw;
    return this._hasValidShape(value) ? value : this._emptyValue();
  }

  _write(value) {
    this._db.set(this._storageKey, JSON.stringify(value));
  }

  static _parse(text) {
    try { return JSON.parse(text); } catch (_) { return null; }
  }
}

module.exports = MeasuredFootprintStore;
