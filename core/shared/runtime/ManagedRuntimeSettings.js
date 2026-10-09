const CudaSnapshot = require('./CudaSnapshot');

class ManagedRuntimeSettings {
  constructor({ settingsDb, cacheKey, manualBinaryPrefix, catalog, runtimeKind, fallbackIds,
    detectRuntimes, getRuntimesDir, getDiagnostics }) {
    this._settingsDb = settingsDb;
    this._cacheKey = cacheKey;
    this._manualPrefix = manualBinaryPrefix;
    this._catalog = catalog;
    this._runtimeKind = runtimeKind;
    this._fallbackIds = fallbackIds || [];
    this._detectRuntimes = detectRuntimes;
    this._getRuntimesDir = getRuntimesDir;
    this._getDiagnostics = getDiagnostics;
    this._inflight = null;
  }

  getManualRuntimeBinary(runtimeId) {
    if (!runtimeId) return null;
    return this._settingsDb.get(this._manualKey(runtimeId), null) || null;
  }

  setManualRuntimeBinary(runtimeId, binaryPath) {
    if (!runtimeId) return;
    const key = this._manualKey(runtimeId);
    if (!binaryPath) this._settingsDb.delete(key);
    else this._settingsDb.set(key, String(binaryPath));
    this.invalidateRuntimesCache();
  }

  getAllManualRuntimeBinaries() {
    const binaries = {};
    for (const id of this._catalogRuntimeIds()) {
      const binaryPath = this.getManualRuntimeBinary(id);
      if (binaryPath) binaries[id] = binaryPath;
    }
    return binaries;
  }

  getCachedRuntimesView() {
    const cached = this._settingsDb.get(this._cacheKey, null);
    return cached && typeof cached === 'object' ? cached : null;
  }

  setCachedRuntimesView(view) {
    if (view == null) this._settingsDb.delete(this._cacheKey);
    else this._settingsDb.set(this._cacheKey, view);
  }

  invalidateRuntimesCache() {
    this._settingsDb.delete(this._cacheKey);
    this._inflight = null;
  }

  async ensureRuntimesView({ force = false } = {}) {
    if (!force) {
      const fresh = this._freshCachedView();
      if (fresh) return fresh;
      if (this._inflight) return this._inflight;
    }
    return this._runProbe({ shared: !force });
  }

  _manualKey(runtimeId) {
    return `${this._manualPrefix}${runtimeId}.manualBinaryPath`;
  }

  _catalogRuntimeIds() {
    try {
      return this._catalog.getCatalog().filter((e) => e.kind === this._runtimeKind).map((e) => e.id);
    } catch (_) {
      return this._fallbackIds;
    }
  }

  _freshCachedView() {
    const cached = this.getCachedRuntimesView();
    if (!cached || cached._cuda === undefined) return null;
    if (CudaSnapshot.isTransientCudaFailure(cached._cuda)) return null;
    if (cached._catalogHash !== this._catalog.fingerprint()) return null;
    return cached;
  }

  async _runProbe({ shared }) {
    const run = this._probe();
    if (shared) this._inflight = run;
    try {
      return await run;
    } finally {
      if (this._inflight === run) this._inflight = null;
    }
  }

  async _probe() {
    const diagnostics = await this._getDiagnostics();
    const view = await this._detectRuntimes({
      runtimesRoot: this._getRuntimesDir(),
      cuda: diagnostics.cuda,
      gpu: diagnostics.gpu,
      manualBinaries: this.getAllManualRuntimeBinaries(),
    });
    this._stamp(view, diagnostics.cuda);
    this.setCachedRuntimesView(view);
    return view;
  }

  _stamp(view, cuda) {
    view._cuda = cuda ? { available: !!cuda.available, reason: cuda.reason || null } : null;
    view._catalogHash = this._catalog.fingerprint();
  }
}

module.exports = ManagedRuntimeSettings;
