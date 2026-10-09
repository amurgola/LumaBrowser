const SettingsValueStore = require('../../database/SettingsValueStore');

class ResolutionCacheSnapshot extends SettingsValueStore {
  static STORAGE_KEY = 'core.browser.resolutionCache';
  static VERSION = 1;

  constructor(db) {
    super(db, ResolutionCacheSnapshot.STORAGE_KEY);
  }

  load() {
    const map = new Map();
    for (const row of this._read().entries) {
      if (ResolutionCacheSnapshot._isRow(row)) map.set(row[0], row[1]);
    }
    return map;
  }

  save(map) {
    this._write({ v: ResolutionCacheSnapshot.VERSION, entries: Array.from(map.entries()) });
  }

  _emptyValue() {
    return { v: ResolutionCacheSnapshot.VERSION, entries: [] };
  }

  _hasValidShape(value) {
    return !!value && typeof value === 'object' && Array.isArray(value.entries);
  }

  static _isRow(row) {
    return Array.isArray(row) && typeof row[0] === 'string' && !!row[1] && !!row[1].selector;
  }
}

module.exports = ResolutionCacheSnapshot;
