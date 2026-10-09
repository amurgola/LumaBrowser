const KvCacheType = require('./KvCacheType');
const ModelFamilies = require('../ModelFamilies');

class KvSettings {
  static DEFAULT_CONTEXT = 4096;

  constructor({ overrides, gguf, family }) {
    this._resolveContext(overrides, gguf);
    this.cacheTypeK = KvCacheType.normalize(overrides.cacheTypeK);
    this.cacheTypeV = KvCacheType.normalize(overrides.cacheTypeV);
    this.forceFlashAttn = !!overrides.forceFlashAttn;
    this.kvOnHost = !!overrides.noKvOffload;
    this._applyFamilyHazard(family);
  }

  forceF16() {
    this.cacheTypeK = 'f16';
    this.cacheTypeV = 'f16';
  }

  _resolveContext(overrides, gguf) {
    const requested = Number(overrides.contextSize) > 0 ? Math.floor(Number(overrides.contextSize)) : null;
    this.requestedContextSize = requested || KvSettings.DEFAULT_CONTEXT;
    this.contextSize = this.requestedContextSize;
    if (gguf && gguf.contextLength && this.contextSize > gguf.contextLength) this.contextSize = gguf.contextLength;
  }

  _applyFamilyHazard(family) {
    const quantRequested = KvCacheType.isQuantized(this.cacheTypeK) || KvCacheType.isQuantized(this.cacheTypeV);
    this.kvQuantForcedF16 = !!(quantRequested && ModelFamilies.kvQuantUnsafe(family));
    if (this.kvQuantForcedF16) this.forceF16();
  }
}

module.exports = KvSettings;
