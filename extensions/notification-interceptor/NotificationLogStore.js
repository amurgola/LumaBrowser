const SettingsValueStore = require('../../core/database/SettingsValueStore');

class NotificationLogStore extends SettingsValueStore {
  static STORAGE_KEY = 'ext.notification-interceptor.log';
  static COUNT_KEY = 'ext.notification-interceptor.count';
  static LOG_LIMIT = 50;

  constructor(db) {
    super(db, NotificationLogStore.STORAGE_KEY);
  }

  entries() {
    const value = this._read();
    return typeof value === 'string' ? JSON.parse(value) : value;
  }

  record(entry) {
    this._writeEntries([entry, ...this.entries()]);
    this._db.set(NotificationLogStore.COUNT_KEY, this.count() + 1);
  }

  count() {
    const n = Number(this._db.get(NotificationLogStore.COUNT_KEY, 0));
    return Number.isFinite(n) ? n : 0;
  }

  clear() {
    this._writeEntries([]);
    this._db.set(NotificationLogStore.COUNT_KEY, 0);
  }

  _writeEntries(entries) {
    this._write(entries.slice(0, NotificationLogStore.LOG_LIMIT));
  }

  _emptyValue() {
    return [];
  }

  _hasValidShape(value) {
    return Array.isArray(value) || NotificationLogStore._isJsonArray(value);
  }

  static _isJsonArray(value) {
    if (typeof value !== 'string') return false;
    try { return Array.isArray(JSON.parse(value)); } catch (_) { return false; }
  }
}

module.exports = NotificationLogStore;
