const OsKeychain = require('../../core/shared/OsKeychain');
const FileMutationQueue = require('../../core/shell/FileMutationQueue');

class ConfigStore {
  static KEY_PREFIX = 'toolForge.config.';

  constructor(rawDb, keychain = new OsKeychain(), log = console) {
    this._db = rawDb;
    this._keychain = keychain;
    this._log = log;
    this._known = new Map();
    this._writes = new FileMutationQueue();
  }

  async open() {
    await this._keychain.ready();
    for (const [key, stored] of Object.entries(this._storedRecords())) {
      const toolName = key.slice(ConfigStore.KEY_PREFIX.length);
      if (!this._known.has(toolName)) this._known.set(toolName, await this._opened(stored));
    }
  }

  idle() {
    return this._writes.run(ConfigStore.KEY_PREFIX, () => {});
  }

  encryptionAvailable() {
    return this._keychain.available();
  }

  setValues(toolName, values, slots) {
    const changes = ConfigStore._changes(values);
    const plain = { ...this._valuesOf(toolName) };
    for (const [key, value] of Object.entries(changes)) {
      if (value === '') delete plain[key];
      else plain[key] = value;
    }
    this._known.set(toolName, plain);
    this._queue(() => this._persist(toolName, changes, ConfigStore._secretKeys(slots)));
    return this.status(toolName, slots);
  }

  resolve(toolName) {
    return { ...this._valuesOf(toolName) };
  }

  status(toolName, slots) {
    const values = this._valuesOf(toolName);
    const list = (slots || []).map((slot) => ConfigStore._slotStatus(slot, values));
    return {
      encryptionAvailable: this.encryptionAvailable(),
      slots: list,
      missingRequired: list.filter((slot) => slot.required && !slot.configured).map((slot) => slot.key),
    };
  }

  clear(toolName) {
    this._known.set(toolName, {});
    this._queue(() => { if (this._db) this._db.set(ConfigStore._key(toolName), {}); });
  }

  _valuesOf(toolName) {
    if (this._known.has(toolName)) return this._known.get(toolName);
    return ConfigStore._plainOnly(this._readRaw(toolName));
  }

  async _persist(toolName, changes, secretKeys) {
    if (!this._db) return;
    const stored = { ...this._readRaw(toolName) };
    const seal = await this._keychain.ready();
    for (const [key, value] of Object.entries(changes)) {
      if (value === '') delete stored[key];
      else stored[key] = seal && secretKeys.has(key) ? await this._keychain.seal(value) : value;
    }
    this._db.set(ConfigStore._key(toolName), stored);
  }

  _queue(write) {
    this._writes.run(ConfigStore.KEY_PREFIX, write)
      .catch((err) => this._log.error('[tool-forge] a config value could not be stored:', err && err.message));
  }

  async _opened(stored) {
    const plain = {};
    for (const [key, value] of Object.entries(stored && typeof stored === 'object' ? stored : {})) {
      if (typeof value === 'string') plain[key] = value;
      else if (value && typeof value === 'object') {
        const { text } = await this._keychain.open(value);
        if (text != null) plain[key] = text;
      }
    }
    return plain;
  }

  _storedRecords() {
    if (!this._db || typeof this._db.getAllKeysWithPrefix !== 'function') return {};
    return this._db.getAllKeysWithPrefix(ConfigStore.KEY_PREFIX) || {};
  }

  _readRaw(toolName) {
    const value = this._db ? this._db.get(ConfigStore._key(toolName), {}) : {};
    return value && typeof value === 'object' ? value : {};
  }

  static _key(toolName) {
    return ConfigStore.KEY_PREFIX + toolName;
  }

  static _changes(values) {
    return Object.fromEntries(Object.entries(values || {}).map(([key, raw]) => [key, raw == null ? '' : String(raw)]));
  }

  static _plainOnly(stored) {
    return Object.fromEntries(Object.entries(stored).filter(([, value]) => typeof value === 'string'));
  }

  static _secretKeys(slots) {
    return new Set((slots || []).filter((slot) => slot.secret).map((slot) => slot.key));
  }

  static _slotStatus(slot, values) {
    return {
      key: slot.key,
      label: slot.label || slot.key,
      secret: !!slot.secret,
      required: !!slot.required,
      configured: Object.prototype.hasOwnProperty.call(values, slot.key) && values[slot.key] !== '' && values[slot.key] != null,
    };
  }
}

module.exports = ConfigStore;
