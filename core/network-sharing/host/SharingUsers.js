const UserStore = require('../UserStore');

class SharingUsers {
  static UNKNOWN_KEY = 'Unknown or disabled access key.';
  static UNKNOWN_USER = 'No such user.';
  static LOGIN_PARAM = 'apiKey';

  constructor({ users, usage, allowList, baseUrl }) {
    this._users = users;
    this._usage = usage;
    this._allowList = allowList;
    this._baseUrl = baseUrl;
  }

  list() {
    return this._users.list().map((user) => ({ ...user, usage: this._usage.get(user.id) }));
  }

  create(fields = {}) {
    const entry = this._users.create(fields);
    return { success: true, user: this._users.list().find((user) => user.id === entry.id), ...this._linkFor(entry.token) };
  }

  update(id, fields = {}) {
    return SharingUsers._reply(this._users.update(id, fields));
  }

  setOverrides(id, overrides = {}) {
    const tools = overrides && Array.isArray(overrides.tools) ? this._allowList.clean(overrides.tools) : null;
    return SharingUsers._reply(this._users.setOverrides(id, { ...(overrides || {}), tools }));
  }

  rotateKey(id) {
    const user = this._users.rotateKey(id);
    if (!user) return { success: false, error: SharingUsers.UNKNOWN_USER };
    return { success: true, user, ...this._linkFor(this._users.keyOf(id)) };
  }

  remove(id) {
    const removed = this._users.remove(id);
    if (removed) this._usage.remove(id);
    return { success: removed };
  }

  loginLink(id) {
    const key = this._users.keyOf(id);
    return key ? { success: true, ...this._linkFor(key) } : { success: false, error: SharingUsers.UNKNOWN_USER };
  }

  credentialFor(key) {
    const entry = this._users.verify(key);
    if (!entry) return null;
    return { id: entry.id, label: entry.name, peerHint: entry.name, kind: entry.kind, viaUser: true, overrides: entry.overrides };
  }

  signIn(key) {
    const credential = this.credentialFor(key);
    if (!credential) return { success: false, error: SharingUsers.UNKNOWN_KEY };
    return { success: true, token: key.trim(), user: credential.label };
  }

  static looksLikeKey(secret) {
    return UserStore.looksLikeKey(secret);
  }

  _linkFor(key) {
    return { key, loginUrl: `${this._baseUrl()}/?${SharingUsers.LOGIN_PARAM}=${encodeURIComponent(key)}` };
  }

  static _reply(user) {
    return user ? { success: true, user } : { success: false, error: SharingUsers.UNKNOWN_USER };
  }
}

module.exports = SharingUsers;
