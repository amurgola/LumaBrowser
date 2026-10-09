const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const FaviconFetcher = require('./FaviconFetcher');

class FaviconCache extends EventEmitter {
  static WRITE_DEBOUNCE_MS = 1500;
  static ACCEPTED_SOURCE = /^(https?:\/\/|data:image\/)/i;

  constructor({ filePath, maxEntries = 2000, fetchImpl = null, timeoutMs = 5000, maxBytes = 64 * 1024 } = {}) {
    super();
    this.filePath = filePath;
    this.maxEntries = maxEntries;
    this.entries = new Map();
    this._fetcher = new FaviconFetcher({ fetchImpl, timeoutMs, maxBytes });
    this._inflight = new Map();
    this._writeTimer = null;
    this._load();
  }

  static hostOf(url) {
    try { return new URL(url).hostname.toLowerCase() || null; } catch (_) { return null; }
  }

  get(host) {
    if (!host) return null;
    const entry = this.entries.get(host);
    if (!entry) return null;
    this._touch(host, entry);
    return entry.dataUrl;
  }

  getMany(hosts) {
    const out = {};
    for (const h of Array.isArray(hosts) ? hosts : []) out[h] = this.get(h);
    return out;
  }

  getForUrl(url) {
    return this.get(FaviconCache.hostOf(url));
  }

  async record(pageUrl, faviconUrl) {
    const host = FaviconCache.hostOf(pageUrl);
    if (!host || !FaviconCache._isAcceptedSource(faviconUrl)) return null;
    const existing = this.entries.get(host);
    if (existing && existing.src === faviconUrl) return existing.dataUrl;
    if (this._inflight.has(host)) return this._inflight.get(host);
    return this._startFetch(host, faviconUrl);
  }

  flush() {
    if (this._writeTimer) {
      clearTimeout(this._writeTimer);
      this._writeTimer = null;
    }
    this._writeNow();
  }

  _startFetch(host, faviconUrl) {
    const p = this._fetcher.toDataUrl(faviconUrl)
      .then((dataUrl) => (dataUrl ? this._store(host, dataUrl, faviconUrl) : null))
      .catch(() => null)
      .finally(() => this._inflight.delete(host));
    this._inflight.set(host, p);
    return p;
  }

  _store(host, dataUrl, src) {
    this._touch(host, { dataUrl, src, at: Date.now() });
    this._evictOverflow();
    this._scheduleWrite();
    this.emit('favicon', { host, dataUrl });
    return dataUrl;
  }

  _touch(host, entry) {
    this.entries.delete(host);
    this.entries.set(host, entry);
  }

  _evictOverflow() {
    while (this.entries.size > this.maxEntries) {
      this.entries.delete(this.entries.keys().next().value);
    }
  }

  _load() {
    if (!this.filePath) return;
    try {
      const parsed = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      if (!parsed || typeof parsed !== 'object') return;
      for (const [host, v] of Object.entries(parsed)) {
        if (v && typeof v.dataUrl === 'string') this.entries.set(host, v);
      }
    } catch (_) {}
  }

  _scheduleWrite() {
    if (!this.filePath || this._writeTimer) return;
    this._writeTimer = setTimeout(() => {
      this._writeTimer = null;
      this._writeNow();
    }, FaviconCache.WRITE_DEBOUNCE_MS);
    if (typeof this._writeTimer.unref === 'function') this._writeTimer.unref();
  }

  _writeNow() {
    if (!this.filePath) return;
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify(Object.fromEntries(this.entries)));
    } catch (err) {
      console.warn('[FaviconCache] write failed:', err && err.message);
    }
  }

  static _isAcceptedSource(faviconUrl) {
    return !!faviconUrl && typeof faviconUrl === 'string' && FaviconCache.ACCEPTED_SOURCE.test(faviconUrl);
  }
}

module.exports = FaviconCache;
