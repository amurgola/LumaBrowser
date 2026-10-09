const ResolutionCacheSnapshot = require('./ResolutionCacheSnapshot');

class ResolutionCacheStore {
  static DEFAULT_MAX_ENTRIES = 2000;
  static DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000;
  static DEFAULT_MAX_SOFT_MISSES = 3;
  static DEFAULT_SAVE_DELAY_MS = 2000;

  static debug = process.env.RESOLUTION_CACHE_DEBUG === '1'
    || process.env.LLM_FALLBACK_DEBUG === '1' || process.env.LLM_FALLBACK_DEBUG === 'true';

  constructor({
    store = null, maxEntries = ResolutionCacheStore.DEFAULT_MAX_ENTRIES, ttlMs = ResolutionCacheStore.DEFAULT_TTL_MS,
    maxSoftMisses = ResolutionCacheStore.DEFAULT_MAX_SOFT_MISSES, saveDelayMs = ResolutionCacheStore.DEFAULT_SAVE_DELAY_MS,
    now = Date.now,
  } = {}) {
    this.store = store;
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
    this.maxSoftMisses = maxSoftMisses;
    this.saveDelayMs = saveDelayMs;
    this.now = now;
    this._snapshot = ResolutionCacheStore._canPersist(store) ? new ResolutionCacheSnapshot(store) : null;
    this._map = null;
    this._saveTimer = null;
    this._counters = { served: 0, hits: 0, misses: 0, stores: 0, evictions: 0 };
  }

  get(key) {
    if (!key) return null;
    const map = this._entries();
    const entry = map.get(key);
    if (!entry) return null;
    if (this._isExpired(entry)) return this._expire(key);
    map.delete(key);
    map.set(key, entry);
    return entry;
  }

  put(key, data) {
    if (!key || !data || !data.selector) return null;
    const map = this._entries();
    const entry = this._buildEntry(map.get(key), data);
    map.delete(key);
    map.set(key, entry);
    this._evictOverflow(map);
    this._counters.stores++;
    this._scheduleSave();
    this._log(`store  source=${entry.source}  key=${key}  selector=${JSON.stringify(entry.selector)}`);
    return entry;
  }

  delete(key) {
    if (this._entries().delete(key)) this._scheduleSave();
  }

  clear() {
    this._entries().clear();
    this._scheduleSave();
  }

  noteHit(key) {
    const entry = this._entries().get(key);
    if (!entry) return;
    entry.hits = (entry.hits || 0) + 1;
    entry.misses = 0;
    entry.lastUsed = this.now();
    this._counters.hits++;
    this._scheduleSave();
  }

  noteMiss(key, { hard = true, reason = '' } = {}) {
    const map = this._entries();
    const entry = map.get(key);
    this._counters.misses++;
    if (!entry) return;
    entry.misses = (entry.misses || 0) + 1;
    const drop = hard || entry.misses >= this.maxSoftMisses;
    if (drop) map.delete(key);
    this._scheduleSave();
    this._log(`miss  ${hard ? 'hard' : 'soft'}  ${drop ? 'dropped' : `count=${entry.misses}`}  key=${key}  reason=${reason}`);
  }

  stats() {
    return { size: this._entries().size, maxEntries: this.maxEntries, ...this._counters };
  }

  flush() {
    if (this._saveTimer) { clearTimeout(this._saveTimer); this._saveTimer = null; }
    if (!this._snapshot || !this._map) return;
    try {
      this._snapshot.save(this._map);
    } catch (err) {
      console.warn('[ResolutionCache] could not save entries:', err.message);
    }
  }

  _log(message) {
    if (this.constructor.debug) console.log(`[ResolutionCache] ${message}`);
  }

  static _canPersist(store) {
    return !!store && typeof store.get === 'function' && typeof store.set === 'function';
  }

  _entries() {
    if (!this._map) this._map = this._loadSaved();
    return this._map;
  }

  _loadSaved() {
    if (!this._snapshot) return new Map();
    try {
      return this._snapshot.load();
    } catch (err) {
      console.warn('[ResolutionCache] could not load saved entries:', err.message);
      return new Map();
    }
  }

  _isExpired(entry) {
    return this.now() - (entry.lastUsed || entry.created || 0) > this.ttlMs;
  }

  _expire(key) {
    this._map.delete(key);
    this._scheduleSave();
    this._log(`expired  key=${key}`);
    return null;
  }

  _buildEntry(previous, data) {
    const t = this.now();
    const sameSelector = !!previous && previous.selector === data.selector;
    return {
      selector: data.selector,
      tag: data.tag || undefined,
      role: data.role || undefined,
      textHint: data.text || data.textHint || '',
      rect: Array.isArray(data.rect) ? data.rect : undefined,
      source: data.source === 'vision' ? 'vision' : 'llm',
      hits: sameSelector ? previous.hits : 0,
      misses: 0,
      created: sameSelector ? previous.created : t,
      lastUsed: t,
    };
  }

  _evictOverflow(map) {
    while (map.size > this.maxEntries) {
      map.delete(map.keys().next().value);
      this._counters.evictions++;
    }
  }

  _scheduleSave() {
    if (!this._snapshot) return;
    if (this.saveDelayMs <= 0) { this.flush(); return; }
    if (this._saveTimer) return;
    this._saveTimer = setTimeout(() => { this._saveTimer = null; this.flush(); }, this.saveDelayMs);
    if (typeof this._saveTimer.unref === 'function') this._saveTimer.unref();
  }
}

module.exports = ResolutionCacheStore;
