const crypto = require('crypto');
const RevocableEntryStore = require('./RevocableEntryStore');

class TokenStore extends RevocableEntryStore {
  static STORAGE_KEY = 'core.sharing.tokens';
  static TOKEN_PREFIX = 'lumapeer_';
  static DEFAULT_LABEL = 'Paired client';
  static LABEL_MAX_LENGTH = 120;
  static TOKEN_PREVIEW_CHARS = 14;

  constructor(db) {
    super(db, TokenStore.STORAGE_KEY);
  }

  static generateToken() {
    return TokenStore.TOKEN_PREFIX + crypto.randomBytes(32).toString('hex');
  }

  list() {
    return this._read().map((entry) => TokenStore._publicView(entry));
  }

  issue({ label, peerHint } = {}) {
    const entry = TokenStore._newEntry(label, peerHint);
    this._write([...this._read(), entry]);
    return entry;
  }

  verify(token) {
    if (!token || typeof token !== 'string') return null;
    return this._touchLastUsed(token);
  }

  remove(id) {
    return this._removeWhere((entry) => entry.id === id);
  }

  static _publicView(entry) {
    return {
      id: entry.id,
      label: entry.label,
      peerHint: entry.peerHint || null,
      createdAt: entry.createdAt,
      lastUsedAt: entry.lastUsedAt || null,
      revoked: !!entry.revoked,
      tokenPreview: RevocableEntryStore._maskToken(entry.token, TokenStore.TOKEN_PREVIEW_CHARS),
    };
  }

  static _newEntry(label, peerHint) {
    return {
      id: crypto.randomUUID(),
      label: String(label || '').slice(0, TokenStore.LABEL_MAX_LENGTH).trim() || TokenStore.DEFAULT_LABEL,
      token: TokenStore.generateToken(),
      peerHint: peerHint ? String(peerHint).slice(0, TokenStore.LABEL_MAX_LENGTH) : null,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      revoked: false,
    };
  }

  _touchLastUsed(token) {
    const list = this._read();
    const found = list.find((entry) => entry.token === token && !entry.revoked);
    if (!found) return null;
    found.lastUsedAt = new Date().toISOString();
    this._write(list);
    return found;
  }
}

module.exports = TokenStore;
