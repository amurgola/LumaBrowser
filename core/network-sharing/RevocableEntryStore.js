const SettingsValueStore = require('../database/SettingsValueStore');

class RevocableEntryStore extends SettingsValueStore {
  static MASK_SUFFIX = '…';

  revoke(id) {
    const list = this._read();
    const found = list.find((entry) => entry.id === id);
    if (!found) return false;
    found.revoked = true;
    this._write(list);
    return true;
  }

  revokeAll() {
    this._write(this._read().map((entry) => ({ ...entry, revoked: true })));
    return true;
  }

  _emptyValue() {
    return [];
  }

  _hasValidShape(value) {
    return Array.isArray(value);
  }

  _findLive(predicate) {
    return this._read().find((entry) => !entry.revoked && predicate(entry)) || null;
  }

  _removeWhere(predicate) {
    const list = this._read();
    const kept = list.filter((entry) => !predicate(entry));
    if (kept.length === list.length) return false;
    this._write(kept);
    return true;
  }

  static _maskToken(token, visibleChars) {
    if (typeof token !== 'string') return null;
    return token.slice(0, visibleChars) + RevocableEntryStore.MASK_SUFFIX;
  }
}

module.exports = RevocableEntryStore;
