class FaviconLookup {
  constructor(faviconCache) {
    this._cache = faviconCache || null;
  }

  get(host) {
    if (!this._cache) return null;
    return this._cache.get(FaviconLookup._normalizeHost(host));
  }

  getMany(hosts) {
    if (!this._cache) return {};
    const list = Array.isArray(hosts) ? hosts.map(FaviconLookup._normalizeHost) : [];
    return this._cache.getMany(list);
  }

  static _normalizeHost(host) {
    return String(host || '').toLowerCase();
  }
}

module.exports = FaviconLookup;
