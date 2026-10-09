const crypto = require('crypto');

class MediaModelCatalog {
  static FINGERPRINT_LENGTH = 16;

  constructor(entries) {
    if (!Array.isArray(entries)) throw new Error(`${this.constructor.name}: entries array is required`);
    this._entries = entries;
    this._cachedFingerprint = null;
  }

  list() {
    return this._entries;
  }

  getById(id) {
    return this._entries.find((entry) => entry.id === id) || null;
  }

  fingerprint() {
    if (!this._cachedFingerprint) this._cachedFingerprint = this._hashEntries();
    return this._cachedFingerprint;
  }

  _hashEntries() {
    return crypto.createHash('sha1')
      .update(JSON.stringify(this._entries))
      .digest('hex')
      .slice(0, MediaModelCatalog.FINGERPRINT_LENGTH);
  }
}

module.exports = MediaModelCatalog;
