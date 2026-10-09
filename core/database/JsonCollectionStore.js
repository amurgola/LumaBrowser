const SettingsValueStore = require('./SettingsValueStore');
const Slug = require('../shared/text/Slug');

class JsonCollectionStore extends SettingsValueStore {
  static ID_SUFFIX_LENGTH = 6;

  constructor(rawDb, { storageKey, entity = 'item' } = {}) {
    super(rawDb, storageKey);
    this._entity = entity;
  }

  list() {
    return this._readAll();
  }

  get(id) {
    if (!id) return null;
    return this._readAll().find((record) => record.id === id) || null;
  }

  delete(id) {
    const all = this._readAll();
    const remaining = all.filter((record) => record.id !== id);
    if (remaining.length === all.length) return false;
    this._writeAll(remaining);
    return true;
  }

  _emptyValue() {
    return [];
  }

  _hasValidShape(value) {
    return Array.isArray(value);
  }

  _readAll() {
    return this._db ? this._read() : [];
  }

  _writeAll(list) {
    if (this._db) this._write(list);
  }

  _slugId(name) {
    return `${Slug.from(name, { fallback: this._entity })}-${JsonCollectionStore._randomSuffix()}`;
  }

  _nameTaken(name, exceptId = null) {
    const wanted = JsonCollectionStore._nameKey(name);
    return this._readAll().some((record) => record.id !== exceptId && JsonCollectionStore._nameKey(record.name) === wanted);
  }

  _add(record) {
    this._writeAll([...this._readAll(), record]);
    return record;
  }

  _put(id, record) {
    const all = this._readAll();
    const index = all.findIndex((existing) => existing.id === id);
    if (index === -1) return null;
    all[index] = record;
    this._writeAll(all);
    return record;
  }

  static _nameKey(name) {
    return String(name || '').trim().toLowerCase();
  }

  static _randomSuffix() {
    return Math.random().toString(36).slice(2, 2 + JsonCollectionStore.ID_SUFFIX_LENGTH);
  }
}

module.exports = JsonCollectionStore;
