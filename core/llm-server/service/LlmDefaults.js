const KeyedSettings = require('./KeyedSettings');
const KvCacheModes = require('../../shared/llm/KvCacheModes');
const ReasoningEffort = require('../../shared/llm/ReasoningEffort');

class LlmDefaults extends KeyedSettings {
  static KEYS = {
    runtimeId: 'core.llmServer.defaults.runtimeId',
    modelPath: 'core.llmServer.defaults.modelPath',
    contextSize: 'core.llmServer.defaults.contextSize',
    kvCacheType: 'core.llmServer.defaults.kvCacheType',
    maxConcurrent: 'core.llmServer.defaults.maxConcurrent',
    tensorSplit: 'core.llmServer.defaults.tensorSplit',
    cacheReuse: 'core.llmServer.defaults.cacheReuse',
    cpuMoe: 'core.llmServer.defaults.cpuMoe',
    noThink: 'core.llmServer.defaults.noThink',
    reasoningEffort: 'core.llmServer.defaults.reasoningEffort',
    usePeerGpus: 'core.llmServer.defaults.usePeerGpus',
    pinModelRam: 'core.llmServer.defaults.pinModelRam',
  };

  static ID_FIELDS = Object.freeze(['runtimeId', 'modelPath']);
  static FLAG_FIELDS = Object.freeze(['tensorSplit', 'cacheReuse', 'cpuMoe', 'noThink', 'usePeerGpus', 'pinModelRam']);
  static DEFAULT_PARALLEL = 1;
  static MAX_PARALLEL = 64;

  constructor({ settingsDb, launchFlags, groupRouter }) {
    super(settingsDb);
    this._launchFlags = launchFlags;
    this._groupRouter = groupRouter;
  }

  get() {
    const modelPath = this._db.get(LlmDefaults.KEYS.modelPath, null);
    return {
      runtimeId: this._db.get(LlmDefaults.KEYS.runtimeId, null),
      modelPath,
      contextSize: this._readContextSize(),
      kvCacheType: this._readKvCacheType(),
      maxConcurrent: this._readMaxConcurrent(),
      ...this._readFlags(),
      reasoningEffort: ReasoningEffort.normalizeEffort(this._db.get(LlmDefaults.KEYS.reasoningEffort, null)),
      groupRouter: !!this._groupRouter.isEnabled(),
      groupRouterPinRam: !!this._groupRouter.isPinEnabled(),
      launchFlags: this._launchFlags.resolve(modelPath),
    };
  }

  set(patch = {}) {
    this._writeIds(patch);
    this._writeLaunchShape(patch);
    this._writeFlags(patch);
    this._writeReasoningEffort(patch.reasoningEffort);
    this._writeGroupRouter(patch);
    this._writeLaunchFlags(patch.launchFlags);
    return this.get();
  }

  _readContextSize() {
    const raw = Number(this._db.get(LlmDefaults.KEYS.contextSize, null));
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : null;
  }

  _readKvCacheType() {
    const raw = this._db.get(LlmDefaults.KEYS.kvCacheType, null);
    return KvCacheModes.MODE_IDS.includes(raw) ? raw : null;
  }

  _readMaxConcurrent() {
    const raw = Number(this._db.get(LlmDefaults.KEYS.maxConcurrent, null));
    return Number.isFinite(raw) && raw >= 1 ? LlmDefaults._clampParallel(raw) : LlmDefaults.DEFAULT_PARALLEL;
  }

  _readFlags() {
    const flags = {};
    for (const field of LlmDefaults.FLAG_FIELDS) flags[field] = !!this._db.get(LlmDefaults.KEYS[field], false);
    return flags;
  }

  _writeIds(patch) {
    for (const field of LlmDefaults.ID_FIELDS) {
      if (patch[field] !== undefined) this._setOrDelete(LlmDefaults.KEYS[field], patch[field] ? String(patch[field]) : null);
    }
  }

  _writeLaunchShape({ contextSize, kvCacheType, maxConcurrent }) {
    if (contextSize !== undefined) {
      this._setOrDelete(LlmDefaults.KEYS.contextSize, Number(contextSize) > 0 ? Math.floor(Number(contextSize)) : null);
    }
    if (kvCacheType !== undefined) {
      this._setOrDelete(LlmDefaults.KEYS.kvCacheType, KvCacheModes.MODE_IDS.includes(kvCacheType) ? String(kvCacheType) : null);
    }
    if (maxConcurrent !== undefined) {
      this._setOrDelete(LlmDefaults.KEYS.maxConcurrent, Number(maxConcurrent) >= 1 ? LlmDefaults._clampParallel(Number(maxConcurrent)) : null);
    }
  }

  _writeFlags(patch) {
    for (const field of LlmDefaults.FLAG_FIELDS) {
      if (patch[field] !== undefined) this._setOrDelete(LlmDefaults.KEYS[field], patch[field] ? true : null);
    }
  }

  _writeReasoningEffort(level) {
    if (level === undefined) return;
    const normalized = ReasoningEffort.normalizeEffort(level);
    this._setOrDelete(LlmDefaults.KEYS.reasoningEffort, normalized === 'default' ? null : normalized);
  }

  _writeGroupRouter({ groupRouter, groupRouterPinRam }) {
    if (groupRouter !== undefined) this._groupRouter.setEnabled(!!groupRouter);
    if (groupRouterPinRam !== undefined) this._groupRouter.setPinEnabled(!!groupRouterPinRam);
  }

  _writeLaunchFlags(text) {
    if (text === undefined) return;
    const modelPath = this._db.get(LlmDefaults.KEYS.modelPath, null);
    if (modelPath) this._launchFlags.setForModel(modelPath, text);
  }

  static _clampParallel(n) {
    return Math.min(LlmDefaults.MAX_PARALLEL, Math.floor(n));
  }
}

module.exports = LlmDefaults;
