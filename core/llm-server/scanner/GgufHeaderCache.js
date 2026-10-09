const fs = require('fs');

class GgufHeaderCache {
  static MAX_ENTRIES = 256;

  static SCHEMA_VERSION = 8;

  constructor({ parse, persistPath = () => '' }) {
    this._parse = parse;
    this._resolvePersistPath = persistPath;
    this._entries = new Map();
    this._persistPath = undefined;
    this._hydrated = false;
    this._dirty = false;
    this._flushing = false;
  }

  async get(filePath, sizeBytes) {
    this._hydrate();
    const key = `${filePath}|${sizeBytes}`;
    if (this._entries.has(key)) return this._entries.get(key);
    const result = await this._parse(filePath);
    if (result) result._v = GgufHeaderCache.SCHEMA_VERSION;
    this._store(key, result);
    if (result && result.ok) this._dirty = true;
    return result;
  }

  async flush() {
    if (!this._dirty || this._flushing) return;
    const file = this._path();
    if (!file) { this._dirty = false; return; }
    this._flushing = true;
    try {
      await fs.promises.writeFile(file, JSON.stringify(this._successfulEntries()));
      this._dirty = false;
    } catch (_) {
    } finally {
      this._flushing = false;
    }
  }

  _hydrate() {
    if (this._hydrated) return;
    this._hydrated = true;
    const file = this._path();
    if (!file) return;
    try {
      const stored = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (stored && typeof stored === 'object') this._loadStored(stored);
    } catch (_) {
    }
  }

  _loadStored(stored) {
    for (const [key, value] of Object.entries(stored)) {
      if (this._entries.size >= GgufHeaderCache.MAX_ENTRIES) break;
      if (value && value._v !== GgufHeaderCache.SCHEMA_VERSION) continue;
      if (!this._entries.has(key)) this._entries.set(key, value);
    }
  }

  _store(key, result) {
    if (this._entries.size >= GgufHeaderCache.MAX_ENTRIES) this._entries.delete(this._entries.keys().next().value);
    this._entries.set(key, result);
  }

  _successfulEntries() {
    const out = {};
    for (const [key, value] of this._entries) {
      if (value && value.ok) out[key] = value;
    }
    return out;
  }

  _path() {
    if (this._persistPath === undefined) {
      try {
        this._persistPath = this._resolvePersistPath() || '';
      } catch (_) {
        this._persistPath = '';
      }
    }
    return this._persistPath;
  }
}

module.exports = GgufHeaderCache;
