class FeatureSettings {
  static PREFIX = 'feature';

  constructor(db, featureId) {
    this._db = db;
    this._prefix = `${FeatureSettings.PREFIX}.${featureId}.`;
  }

  get(key, defaultValue = null) {
    return this._db.get(this._key(key), defaultValue);
  }

  set(key, value) {
    this._db.set(this._key(key), value);
  }

  delete(key) {
    this._db.delete(this._key(key));
  }

  all() {
    const out = {};
    const rows = this._db.getAll(this._prefix) || {};
    const full = `${this._db.getNamespace()}.${this._prefix}`;
    for (const [key, value] of Object.entries(rows)) {
      if (key.startsWith(full)) out[key.slice(full.length)] = value;
    }
    return out;
  }

  _key(key) {
    const name = String(key || '');
    if (!name) throw new Error('A setting needs a key');
    return this._prefix + name;
  }
}

module.exports = FeatureSettings;
