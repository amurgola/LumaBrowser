const OsKeychain = require('../../../shared/OsKeychain');
const FileMutationQueue = require('../../../shell/FileMutationQueue');

class TriggerSecrets {
  static KEY_PREFIX = 'core.triggers.secret.';

  constructor(settingsDb, keychain = new OsKeychain(), log = console) {
    this.db = settingsDb;
    this._keychain = keychain;
    this._log = log;
    this._known = new Map();
    this._writes = new FileMutationQueue();
  }

  async open() {
    await this._keychain.ready();
    for (const [key, record] of Object.entries(this._storedRecords())) {
      if (this._known.has(key)) continue;
      const { text, stale } = await this._keychain.open(record);
      if (text == null) continue;
      this._known.set(key, text);
      if (stale) this._store(key, text);
    }
  }

  idle() {
    return this._writes.run(TriggerSecrets.KEY_PREFIX, () => {});
  }

  encryptionAvailable() {
    return this._keychain.available();
  }

  has(id) {
    const key = TriggerSecrets._key(id);
    if (this._known.has(key)) return this._known.get(key) != null;
    const stored = this._read(key);
    return !!(stored && (stored.enc || stored.plain));
  }

  get(id) {
    const key = TriggerSecrets._key(id);
    if (this._known.has(key)) return this._known.get(key);
    const stored = this._read(key);
    return stored && stored.plain ? String(stored.plain) : null;
  }

  set(id, value) {
    const text = value == null ? '' : String(value);
    if (!text) {
      this.delete(id);
      return { set: false, encrypted: false };
    }
    const key = TriggerSecrets._key(id);
    this._known.set(key, text);
    this._store(key, text);
    return { set: true, encrypted: this.encryptionAvailable() };
  }

  delete(id) {
    const key = TriggerSecrets._key(id);
    this._known.set(key, null);
    this._queue(() => this._remove(key));
  }

  _store(key, text) {
    this._queue(async () => {
      const record = await this._keychain.seal(text);
      if (this.db) this.db.set(key, record);
    });
  }

  _queue(write) {
    this._writes.run(TriggerSecrets.KEY_PREFIX, write)
      .catch((err) => this._log.error('[secrets] a secret could not be stored:', err && err.message));
  }

  _remove(key) {
    if (!this.db) return;
    if (typeof this.db.delete === 'function') this.db.delete(key);
    else this.db.set(key, null);
  }

  _storedRecords() {
    if (!this.db || typeof this.db.getAllKeysWithPrefix !== 'function') return {};
    return this.db.getAllKeysWithPrefix(TriggerSecrets.KEY_PREFIX) || {};
  }

  _read(key) {
    return this.db ? this.db.get(key, null) : null;
  }

  static _key(id) {
    return TriggerSecrets.KEY_PREFIX + id;
  }
}

module.exports = TriggerSecrets;
