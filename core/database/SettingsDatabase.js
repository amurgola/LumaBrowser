const SqliteOpener = require('./SqliteOpener');
const SettingsSchema = require('./settings/SettingsSchema');
const SettingsRepository = require('./settings/SettingsRepository');
const NetworkWatcherRepository = require('./settings/NetworkWatcherRepository');

class SettingsDatabase {
  constructor(dbPath) {
    this.db = SqliteOpener.open(dbPath);
    SettingsSchema.apply(this.db);
    this._settings = new SettingsRepository(this.db);
    this._watchers = new NetworkWatcherRepository(this.db);
  }

  get(key, defaultValue = null) { return this._settings.get(key, defaultValue); }
  set(key, value) { this._settings.set(key, value); }
  delete(key) { this._settings.delete(key); }
  has(key) { return this._settings.has(key); }
  getAllKeysWithPrefix(prefix) { return this._settings.getAllKeysWithPrefix(prefix); }
  migrateKeys(mappings) { return this._settings.migrateKeys(mappings); }
  replacePathPrefix(oldPrefix, newPrefix) { return this._settings.replacePathPrefix(oldPrefix, newPrefix); }

  addWatcher(watcher) { this._watchers.addWatcher(watcher); }
  hasWatcher(urlPattern, method) { return this._watchers.hasWatcher(urlPattern, method); }
  updateWatcher(id, data) { this._watchers.updateWatcher(id, data); }
  removeWatcher(id) { return this._watchers.removeWatcher(id); }
  getAllWatchers() { return this._watchers.getAllWatchers(); }

  close() {
    this.db.close();
  }
}

module.exports = SettingsDatabase;
