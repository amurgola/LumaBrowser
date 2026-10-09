const fs = require('fs');
const path = require('path');

class GameDataStore {
  static STORE_DIR = '.gamedata';
  static STORE_FILE = 'store.json';
  static MAX_VALUE_BYTES = 64 * 1024;
  static MAX_TOTAL_BYTES = 4 * 1024 * 1024;
  static MAX_KEYS_PER_COLLECTION = 2000;
  static MAX_COLLECTIONS = 64;
  static NAME_RE = /^[A-Za-z0-9_.:-]{1,64}$/;

  static isValidName(name) {
    return typeof name === 'string' && GameDataStore.NAME_RE.test(name);
  }

  static _byteLength(value) {
    return Buffer.byteLength(JSON.stringify(value), 'utf8');
  }

  static _copy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  constructor(gameDir) {
    this.dir = path.join(gameDir, GameDataStore.STORE_DIR);
    this.file = path.join(this.dir, GameDataStore.STORE_FILE);
    this._doc = null;
  }

  get rev() {
    return this._load().rev;
  }

  all() {
    return GameDataStore._copy(this._load());
  }

  list(collection) {
    if (!GameDataStore.isValidName(collection)) return {};
    const col = this._load().collections[collection];
    return col ? GameDataStore._copy(col) : {};
  }

  get(collection, key) {
    if (!GameDataStore.isValidName(collection) || !GameDataStore.isValidName(key)) return undefined;
    const col = this._load().collections[collection];
    if (!col || !Object.prototype.hasOwnProperty.call(col, key)) return undefined;
    return GameDataStore._copy(col[key]);
  }

  mutate(collection, ops = {}) {
    if (!GameDataStore.isValidName(collection)) {
      return { success: false, error: `invalid collection name "${collection}" (letters, digits, _ . : - up to 64 chars)` };
    }
    const setObj = ops && ops.set && typeof ops.set === 'object' ? ops.set : {};
    const removeKeys = Array.isArray(ops && ops.remove) ? ops.remove : [];
    const invalid = this._checkValues(setObj) || this._checkCollectionRoom(collection);
    if (invalid) return invalid;
    const next = this._nextCollection(collection, setObj, removeKeys);
    const overflow = this._checkSize(collection, next);
    if (overflow) return overflow;
    return this._commit(collection, next);
  }

  set(collection, key, value) {
    return this.mutate(collection, { set: { [String(key)]: value } });
  }

  remove(collection, key) {
    return this.mutate(collection, { remove: [String(key)] });
  }

  clear(collection) {
    if (!GameDataStore.isValidName(collection)) return { success: false, error: `invalid collection name "${collection}"` };
    const doc = this._load();
    if (!doc.collections[collection]) return { success: true, rev: doc.rev };
    return this._commit(collection, null);
  }

  reset() {
    this._doc = { rev: (this._load().rev || 0) + 1, collections: {} };
    try { this._flush(); } catch (e) { return { success: false, error: e.message }; }
    return { success: true, rev: this._doc.rev };
  }

  _load() {
    if (this._doc) return this._doc;
    let doc = null;
    try { doc = JSON.parse(fs.readFileSync(this.file, 'utf8')); } catch (_) { doc = null; }
    if (!doc || typeof doc !== 'object' || typeof doc.collections !== 'object' || !doc.collections) {
      doc = { rev: 0, collections: {} };
    }
    if (!Number.isFinite(doc.rev)) doc.rev = 0;
    this._doc = doc;
    return doc;
  }

  _flush() {
    fs.mkdirSync(this.dir, { recursive: true });
    const tmp = `${this.file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this._load()), 'utf8');
    fs.renameSync(tmp, this.file);
  }

  _checkValues(setObj) {
    for (const k of Object.keys(setObj)) {
      if (!GameDataStore.isValidName(k)) return { success: false, error: `invalid key "${k}"` };
      if (setObj[k] === undefined) return { success: false, error: `value for "${k}" is undefined` };
      const n = GameDataStore._byteLength(setObj[k]);
      if (n > GameDataStore.MAX_VALUE_BYTES) {
        return { success: false, error: `value for "${k}" is ${n} bytes (max ${GameDataStore.MAX_VALUE_BYTES}); store less per key` };
      }
    }
    return null;
  }

  _checkCollectionRoom(collection) {
    const cols = this._load().collections;
    if (cols[collection] || Object.keys(cols).length < GameDataStore.MAX_COLLECTIONS) return null;
    return { success: false, error: `too many collections (max ${GameDataStore.MAX_COLLECTIONS})` };
  }

  _nextCollection(collection, setObj, removeKeys) {
    const next = { ...(this._load().collections[collection] || {}) };
    for (const k of removeKeys) delete next[k];
    for (const [k, v] of Object.entries(setObj)) next[k] = GameDataStore._copy(v);
    return next;
  }

  _checkSize(collection, next) {
    const keys = Object.keys(next).length;
    if (keys > GameDataStore.MAX_KEYS_PER_COLLECTION) {
      return { success: false, error: `collection "${collection}" would hold ${keys} keys (max ${GameDataStore.MAX_KEYS_PER_COLLECTION})` };
    }
    const total = GameDataStore._byteLength({ ...this._load().collections, [collection]: next });
    if (total > GameDataStore.MAX_TOTAL_BYTES) {
      return { success: false, error: `store would be ${total} bytes (max ${GameDataStore.MAX_TOTAL_BYTES}); remove data` };
    }
    return null;
  }

  _commit(collection, next) {
    const doc = this._load();
    const had = Object.prototype.hasOwnProperty.call(doc.collections, collection);
    const before = doc.collections[collection];
    if (next === null) delete doc.collections[collection];
    else doc.collections[collection] = next;
    doc.rev += 1;
    try {
      this._flush();
    } catch (e) {
      if (had) doc.collections[collection] = before;
      else delete doc.collections[collection];
      doc.rev -= 1;
      return { success: false, error: `could not write store: ${e.message}` };
    }
    return { success: true, rev: doc.rev };
  }
}

module.exports = GameDataStore;
