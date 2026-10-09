class TriggerSecrets {
  static KEY_PREFIX = 'core.triggers.secret.';

  constructor(settingsDb, crypto) {
    this.db = settingsDb;
    this._crypto = crypto || null;
  }

  encryptionAvailable() {
    const storage = this._safeStorage();
    try { return !!(storage && storage.isEncryptionAvailable && storage.isEncryptionAvailable()); } catch (_) { return false; }
  }

  has(id) {
    const stored = this._read(id);
    return !!(stored && (stored.enc || stored.plain));
  }

  get(id) {
    const stored = this._read(id);
    if (!stored) return null;
    if (stored.plain) return String(stored.plain);
    return stored.enc ? this._decrypt(stored.enc) : null;
  }

  set(id, value) {
    const text = value == null ? '' : String(value);
    if (!text) {
      this.delete(id);
      return { set: false, encrypted: false };
    }
    const encrypted = this.encryptionAvailable();
    this.db.set(TriggerSecrets._key(id), encrypted ? { enc: this._encrypt(text) } : { plain: text });
    return { set: true, encrypted };
  }

  delete(id) {
    try {
      if (this.db && typeof this.db.delete === 'function') this.db.delete(TriggerSecrets._key(id));
      else if (this.db) this.db.set(TriggerSecrets._key(id), null);
    } catch (_) {}
  }

  _safeStorage() {
    if (this._crypto) return this._crypto;
    try { this._crypto = require('electron').safeStorage; } catch (_) { this._crypto = null; }
    return this._crypto;
  }

  _read(id) {
    return this.db ? this.db.get(TriggerSecrets._key(id), null) : null;
  }

  _encrypt(text) {
    return this._safeStorage().encryptString(text).toString('base64');
  }

  _decrypt(base64) {
    try { return this._safeStorage().decryptString(Buffer.from(base64, 'base64')); } catch (_) { return null; }
  }

  static _key(id) {
    return TriggerSecrets.KEY_PREFIX + id;
  }
}

module.exports = TriggerSecrets;
