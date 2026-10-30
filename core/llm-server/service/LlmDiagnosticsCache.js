const CudaDeviceProbe = require('../../shared/runtime/CudaDeviceProbe');
const CudaSnapshot = require('../../shared/runtime/CudaSnapshot');

class LlmDiagnosticsCache {
  static STORAGE_KEY = 'core.llmServer.diagnosticsCache';
  static SCHEMA = 4;
  static TOTAL_DRIFT_MB = 256;

  constructor({ settingsDb, smiPath, gather, invalidateRuntimes, getRuntimesDir = null, liveCardTotals = () => CudaDeviceProbe.liveCardTotals() }) {
    this._liveCardTotals = liveCardTotals;
    this._getRuntimesDir = getRuntimesDir;
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
    else this._db.set(LlmDiagnosticsCache.STORAGE_KEY, { ...data, _cachedAt: new Date().toISOString(), _schema: LlmDiagnosticsCache.SCHEMA });
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
    if (!cached || cached._schema !== LlmDiagnosticsCache.SCHEMA || CudaSnapshot.isTransientCudaFailure(cached.cuda)) return null;
    if (this._cardTotalsMoved(cached)) return null;
    this._overlayHintFlag(cached);
    return cached;
  }

  _cardTotalsMoved(cached) {
    let live = null;
    try { live = this._liveCardTotals(); } catch (_) { live = null; }
    if (!Array.isArray(live) || live.length === 0) return false;
    const cards = (cached.cuda && cached.cuda.available && Array.isArray(cached.cuda.devices) ? cached.cuda.devices : [])
      .filter((d) => d && Number(d.memoryTotalMB) > 0);
    if (cards.length !== live.length) return true;
    const MIB = 1024 * 1024;
    return live.some((row, i) => Math.abs(row.totalBytes / MIB - Number(cards[i].memoryTotalMB)) > LlmDiagnosticsCache.TOTAL_DRIFT_MB);
  }

  async _probe() {
    const wasCudaAvailable = this._cachedCudaAvailable();
    const runtimesRoot = this._getRuntimesDir ? this._getRuntimesDir() : null;
    const data = await this._gather({ savedNvidiaSmiPath: this._smiPath.getSavedPath(), runtimesRoot });
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
