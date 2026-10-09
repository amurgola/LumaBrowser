const UrlIdentity = require('./UrlIdentity');

class PageCache {
  static TTL_MS = 5 * 60 * 1000;
  static CAPACITY = 16;

  constructor({ ttlMs = PageCache.TTL_MS, capacity = PageCache.CAPACITY, now = Date.now } = {}) {
    this._ttlMs = ttlMs;
    this._capacity = capacity;
    this._now = now;
    this._entries = new Map();
  }

  get(url) {
    const key = UrlIdentity.key(url);
    const entry = this._entries.get(key);
    if (!entry) return null;
    this._entries.delete(key);
    if (this._now() - entry.storedAt > this._ttlMs) return null;
    this._entries.set(key, entry);
    return entry.document;
  }

  put(document) {
    const storedAt = this._now();
    for (const url of new Set([document.requestedUrl, document.url])) {
      const key = UrlIdentity.key(url);
      if (!key) continue;
      this._entries.delete(key);
      this._entries.set(key, { document, storedAt });
    }
    this._evictOverflow();
  }

  size() {
    return this._entries.size;
  }

  _evictOverflow() {
    for (const key of this._entries.keys()) {
      if (this._entries.size <= this._capacity) return;
      this._entries.delete(key);
    }
  }
}

module.exports = PageCache;
