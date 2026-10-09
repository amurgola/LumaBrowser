const CatalogBuilder = require('./CatalogBuilder');
const CuratedModelCatalog = require('./CuratedModelCatalog');

class LiveCatalog {
  static REFRESH_TTL_MS = 6 * 60 * 60 * 1000;

  static shared = new LiveCatalog();

  constructor({ builder = new CatalogBuilder(), fallback = () => CuratedModelCatalog.listCatalog(), ttlMs = LiveCatalog.REFRESH_TTL_MS } = {}) {
    this._builder = builder;
    this._fallback = fallback;
    this._ttlMs = ttlMs;
    this._cache = null;
  }

  async get({ now = Date.now(), force = false, signal } = {}) {
    if (this._isFresh(now, force)) return { models: this._cache.models, source: 'cache', errors: [] };
    try {
      const { models, errors } = await this._builder.build(CatalogBuilder.CURATED_REPOS, { signal });
      if (!models.length) return this._fallbackResult(errors);
      this._cache = { at: now, models };
      return { models, source: 'live', errors };
    } catch (err) {
      return this._fallbackResult([{ error: err.message || String(err) }]);
    }
  }

  reset() {
    this._cache = null;
  }

  _isFresh(now, force) {
    return !!this._cache && !force && (now - this._cache.at) < this._ttlMs;
  }

  _fallbackResult(errors) {
    return { models: (this._cache && this._cache.models) || this._fallback(), source: 'fallback', errors };
  }
}

module.exports = LiveCatalog;
