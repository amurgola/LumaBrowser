const SettingsValueStore = require('../../database/SettingsValueStore');

class PersistedTabList extends SettingsValueStore {
  static STORAGE_KEY = 'core.browser.persistedTabs';

  constructor(db) {
    super(db, PersistedTabList.STORAGE_KEY);
  }

  read() {
    return this._read().filter((item) => item && typeof item === 'object');
  }

  write(entries) {
    this._write(entries.map((entry) => ({ url: entry.url, title: entry.title, partition: entry.partition })));
  }

  _emptyValue() {
    return [];
  }

  _hasValidShape(value) {
    return Array.isArray(value);
  }
}

module.exports = PersistedTabList;
