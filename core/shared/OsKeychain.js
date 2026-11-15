class OsKeychain {
  constructor(safeStorage = null) {
    this._safeStorage = safeStorage;
    this._asked = null;
    this._available = false;
  }

  ready() {
    if (!this._asked) this._asked = this._ask();
    return this._asked;
  }

  available() {
    return this._available;
  }

  async seal(text) {
    if (!(await this.ready())) return { plain: text };
    const sealed = await this._storage().encryptStringAsync(text);
    return { enc: sealed.toString('base64') };
  }

  async open(record) {
    if (!record || typeof record !== 'object') return OsKeychain._unopened();
    if (typeof record.plain === 'string') return { text: record.plain, stale: false };
    if (typeof record.enc !== 'string' || !(await this.ready())) return OsKeychain._unopened();
    try {
      const opened = await this._storage().decryptStringAsync(Buffer.from(record.enc, 'base64'));
      return { text: String(opened.result), stale: !!opened.shouldReEncrypt };
    } catch (_) {
      return OsKeychain._unopened();
    }
  }

  async _ask() {
    const storage = this._storage();
    try {
      this._available = !!(storage && typeof storage.isAsyncEncryptionAvailable === 'function' && await storage.isAsyncEncryptionAvailable());
    } catch (_) {
      this._available = false;
    }
    return this._available;
  }

  _storage() {
    if (this._safeStorage) return this._safeStorage;
    try { this._safeStorage = require('electron').safeStorage || null; } catch (_) { this._safeStorage = null; }
    return this._safeStorage;
  }

  static _unopened() {
    return { text: null, stale: false };
  }
}

module.exports = OsKeychain;
