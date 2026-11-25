const crypto = require('crypto');
const RevocableEntryStore = require('./RevocableEntryStore');
const UserOverrides = require('./host/UserOverrides');

class UserStore extends RevocableEntryStore {
  static STORAGE_KEY = 'core.sharing.users';
  static KEY_PREFIX = 'lumauser_';
  static KINDS = ['person', 'group'];
  static DEFAULT_NAME = 'Guest';
  static NAME_MAX_LENGTH = 80;
  static KEY_PREVIEW_CHARS = 14;

  constructor(db) {
    super(db, UserStore.STORAGE_KEY);
  }

  static generateKey() {
    return UserStore.KEY_PREFIX + crypto.randomBytes(32).toString('hex');
  }

  static looksLikeKey(secret) {
    return typeof secret === 'string' && secret.trim().startsWith(UserStore.KEY_PREFIX);
  }

  list() {
    return this._read().map((entry) => UserStore._publicView(entry));
  }

  create({ name, kind } = {}) {
    const entry = UserStore._newEntry(name, kind);
    this._write([...this._read(), entry]);
    return entry;
  }

  verify(key) {
    if (!UserStore.looksLikeKey(key)) return null;
    const list = this._read();
    const found = list.find((entry) => entry.token === key.trim() && !entry.revoked);
    if (!found) return null;
    found.lastUsedAt = new Date().toISOString();
    this._write(list);
    return found;
  }

  keyOf(id) {
    const found = this._read().find((entry) => entry.id === id);
    return found ? found.token : null;
  }

  update(id, { name, kind } = {}) {
    return this._patch(id, (entry) => {
      if (name !== undefined) entry.name = UserStore._cleanName(name);
      if (kind !== undefined) entry.kind = UserStore._cleanKind(kind);
    });
  }

  setOverrides(id, overrides) {
    return this._patch(id, (entry) => { entry.overrides = UserOverrides.normalize(overrides); });
  }

  rotateKey(id) {
    return this._patch(id, (entry) => {
      entry.token = UserStore.generateKey();
      entry.revoked = false;
    });
  }

  remove(id) {
    return this._removeWhere((entry) => entry.id === id);
  }

  _patch(id, change) {
    const list = this._read();
    const found = list.find((entry) => entry.id === id);
    if (!found) return null;
    change(found);
    this._write(list);
    return UserStore._publicView(found);
  }

  static _publicView(entry) {
    return {
      id: entry.id,
      name: entry.name,
      kind: entry.kind,
      createdAt: entry.createdAt,
      lastUsedAt: entry.lastUsedAt || null,
      revoked: !!entry.revoked,
      keyPreview: RevocableEntryStore._maskToken(entry.token, UserStore.KEY_PREVIEW_CHARS),
      overrides: UserOverrides.normalize(entry.overrides),
    };
  }

  static _newEntry(name, kind) {
    return {
      id: crypto.randomUUID(),
      name: UserStore._cleanName(name),
      kind: UserStore._cleanKind(kind),
      token: UserStore.generateKey(),
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      revoked: false,
      overrides: UserOverrides.normalize(null),
    };
  }

  static _cleanName(name) {
    return String(name || '').slice(0, UserStore.NAME_MAX_LENGTH).trim() || UserStore.DEFAULT_NAME;
  }

  static _cleanKind(kind) {
    return UserStore.KINDS.includes(kind) ? kind : UserStore.KINDS[0];
  }
}

module.exports = UserStore;
