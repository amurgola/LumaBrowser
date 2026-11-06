class VaultCipher {
  constructor(crypto = null) {
    this._crypto = crypto;
  }

  available() {
    const storage = this._storage();
    try { return !!(storage && storage.isEncryptionAvailable && storage.isEncryptionAvailable()); } catch (_) { return false; }
  }

  seal(text) {
    if (!this.available()) return { plain: text };
    return { enc: this._storage().encryptString(text).toString('base64') };
  }

  open(record) {
    if (!record || typeof record !== 'object') return null;
    if (typeof record.plain === 'string') return record.plain;
    if (typeof record.enc !== 'string' || !this.available()) return null;
    try { return this._storage().decryptString(Buffer.from(record.enc, 'base64')); } catch (_) { return null; }
  }

  _storage() {
    if (this._crypto) return this._crypto;
    try { this._crypto = require('electron').safeStorage || null; } catch (_) { this._crypto = null; }
    return this._crypto;
  }
}

module.exports = VaultCipher;
