class KeyedSettings {
  constructor(settingsDb) {
    this._db = settingsDb;
  }

  _setOrDelete(key, value) {
    if (value === null) this._db.delete(key);
    else this._db.set(key, value);
  }
}

module.exports = KeyedSettings;
