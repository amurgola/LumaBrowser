const CudaSnapshot = require('../../shared/runtime/CudaSnapshot');

class LlmDiagnosticsCache {
  static STORAGE_KEY = 'core.llmServer.diagnosticsCache';

  constructor({ settingsDb, smiPath, gather, invalidateRuntimes }) {
    this._db = settingsDb;
    this._smiPath = smiPath;
    this._gather = gather;
    this._invalidateRuntimes = invalidateRuntimes;
    this._inflight = null;
  }

  getCached() {
    const cached = this._db.get(LlmDiagnosticsCache.STORAGE_KEY, null);
    return cached && typeof cached === 'object' ? cached : null;
  }

  setCached(data) {
    if (data == null) this._db.delete(LlmDiagnosticsCache.STORAGE_KEY);
    else this._db.set(LlmDiagnosticsCache.STORAGE_KEY, { ...data, _cachedAt: new Date().toISOString() });
  }

  async ensure({ force = false } = {}) {
    if (!force) {
      const cached = this._servableCache();
      if (cached) return cached;
      if (this._inflight) return this._inflight;
    }
    const run = this._probe();
    if (!force) this._inflight = run;
    try {
      const data = await run;
      if (force) this._invalidateRuntimes();
      return data;
    } finally {
      if (this._inflight === run) this._inflight = null;
    }
  }

  _servableCache() {
    const cached = this.getCached();
    if (!cached || CudaSnapshot.isTransientCudaFailure(cached.cuda)) return null;
    this._overlayHintFlag(cached);
    return cached;
  }

  async _probe() {
    const wasCudaAvailable = this._cachedCudaAvailable();
    const data = await this._gather({ savedNvidiaSmiPath: this._smiPath.getSavedPath() });
    if (LlmDiagnosticsCache._cudaAvailable(data) !== wasCudaAvailable) this._invalidateRuntimes();
    this._rememberDiscoveredSmiPath(data);
    this._overlayHintFlag(data);
    this.setCached(data);
    return data;
  }

  _cachedCudaAvailable() {
    return LlmDiagnosticsCache._cudaAvailable(this.getCached());
  }

  _rememberDiscoveredSmiPath(data) {
    const discovered = data.cuda && data.cuda.discoveredPath;
    if (discovered && this._smiPath.getSavedPath() !== discovered) this._smiPath.setSavedPath(discovered);
  }

  _overlayHintFlag(data) {
    if (data.cuda) data.cuda.pathHintDismissed = this._smiPath.isHintDismissed();
  }

  static _cudaAvailable(data) {
    return !!(data && data.cuda && data.cuda.available);
  }
}

module.exports = LlmDiagnosticsCache;
