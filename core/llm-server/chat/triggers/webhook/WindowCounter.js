class WindowCounter {
  static MAX_KEYS = 5000;

  constructor(windowMs) {
    this._windowMs = windowMs;
    this._hits = new Map();
  }

  hit(key, now = Date.now()) {
    const recent = this._recent(key, now);
    recent.push(now);
    this._hits.set(key, recent);
    this._evictOldestKey();
    return recent.length;
  }

  count(key, now = Date.now()) {
    return this._recent(key, now).length;
  }

  _recent(key, now) {
    return (this._hits.get(key) || []).filter((t) => now - t < this._windowMs);
  }

  _evictOldestKey() {
    if (this._hits.size > WindowCounter.MAX_KEYS) this._hits.delete(this._hits.keys().next().value);
  }
}

module.exports = WindowCounter;
