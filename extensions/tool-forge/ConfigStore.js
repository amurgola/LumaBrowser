class ConfigStore {
  static KEY_PREFIX = 'toolForge.config.';

  constructor(rawDb, crypto) {
    this._db = rawDb;
    this._crypto = crypto || null;
  }

  encryptionAvailable() {
    const crypto = this._safeStorage();
    try { return !!(crypto && crypto.isEncryptionAvailable && crypto.isEncryptionAvailable()); } catch (_) { return false; }
  }

  setValues(toolName, values, slots) {
    const stored = { ...this._readRaw(toolName) };
    const encryptKeys = this.encryptionAvailable() ? ConfigStore._secretKeys(slots) : new Set();
    for (const [key, raw] of Object.entries(values || {})) {
      const value = raw == null ? '' : String(raw);
      if (value === '') delete stored[key];
      else stored[key] = encryptKeys.has(key) ? this._encrypt(value) : value;
    }
    if (this._db) this._db.set(ConfigStore._key(toolName), stored);
    return this.status(toolName, slots);
  }

  resolve(toolName) {
    const out = {};
    for (const [key, value] of Object.entries(this._readRaw(toolName))) {
      const plain = this._plain(value);
      if (plain !== undefined) out[key] = plain;
    }
    return out;
  }

  status(toolName, slots) {
    const stored = this._readRaw(toolName);
    const list = (slots || []).map((slot) => ConfigStore._slotStatus(slot, stored));
    return {
      encryptionAvailable: this.encryptionAvailable(),
      slots: list,
      missingRequired: list.filter((slot) => slot.required && !slot.configured).map((slot) => slot.key),
    };
  }

  clear(toolName) {
    if (this._db) this._db.set(ConfigStore._key(toolName), {});
  }

  _safeStorage() {
    if (this._crypto) return this._crypto;
    try {
      this._crypto = require('electron').safeStorage;
    } catch (_) {
      this._crypto = null;
    }
    return this._crypto;
  }

  _readRaw(toolName) {
    const value = this._db ? this._db.get(ConfigStore._key(toolName), {}) : {};
    return value && typeof value === 'object' ? value : {};
  }

  _encrypt(value) {
    return { enc: this._safeStorage().encryptString(value).toString('base64') };
  }

  _plain(value) {
    if (typeof value === 'string') return value;
    if (!value || typeof value !== 'object' || typeof value.enc !== 'string') return undefined;
    try {
      return this._safeStorage().decryptString(Buffer.from(value.enc, 'base64'));
    } catch (_) {
      return undefined;
    }
  }

  static _key(toolName) {
    return ConfigStore.KEY_PREFIX + toolName;
  }

  static _secretKeys(slots) {
    return new Set((slots || []).filter((slot) => slot.secret).map((slot) => slot.key));
  }

  static _slotStatus(slot, stored) {
    return {
      key: slot.key,
      label: slot.label || slot.key,
      secret: !!slot.secret,
      required: !!slot.required,
      configured: Object.prototype.hasOwnProperty.call(stored, slot.key) && stored[slot.key] !== '' && stored[slot.key] != null,
    };
  }
}

module.exports = ConfigStore;
