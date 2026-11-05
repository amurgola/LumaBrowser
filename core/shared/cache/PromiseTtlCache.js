class PromiseTtlCache {
  constructor({ ttlMs, capacity = 64, now = Date.now } = {}) {
    this._ttlMs = Number(ttlMs) > 0 ? Number(ttlMs) : 60 * 1000;
    this._capacity = Math.max(1, Number(capacity) || 1);
    this._now = now;
    this._entries = new Map();
  }

  get size() {
    return this._entries.size;
  }

  get(key, load) {
    const k = String(key);
    const entry = this._entries.get(k);
    if (entry && !this._stale(entry)) {
      this._entries.delete(k);
      this._entries.set(k, entry);
      return entry.promise;
    }
    const promise = Promise.resolve().then(load);
    this._store(k, promise);
    promise.catch(() => { if (this._entries.get(k) && this._entries.get(k).promise === promise) this._entries.delete(k); });
    return promise;
  }

  has(key) {
    const entry = this._entries.get(String(key));
    return !!entry && !this._stale(entry);
  }

  delete(key) {
    this._entries.delete(String(key));
  }

  clear() {
    this._entries.clear();
  }

  _store(key, promise) {
    this._entries.delete(key);
    while (this._entries.size >= this._capacity) this._entries.delete(this._entries.keys().next().value);
    this._entries.set(key, { promise, storedAt: this._now() });
  }

  _stale(entry) {
    return this._now() - entry.storedAt > this._ttlMs;
  }
}

module.exports = PromiseTtlCache;
