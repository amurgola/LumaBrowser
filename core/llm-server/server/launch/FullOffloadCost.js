const KvCacheSizer = require('./KvCacheSizer');
const GpuOverhead = require('./GpuOverhead');
const DraftBranchCost = require('./DraftBranchCost');

class FullOffloadCost {
  static bytes(input) {
    const { modelBytes, mmprojBytes, flashAttnSupported } = input;
    const kvTotal = FullOffloadCost._kvTotal(input);
    const draftBranch = FullOffloadCost._draftBranch(input);
    return Math.round(modelBytes + (mmprojBytes || 0) + kvTotal + GpuOverhead.fixed(flashAttnSupported) + draftBranch);
  }

  static noHeaderBytes({ modelBytes, mmprojBytes, drafterBytes, mtpBranchBytes }) {
    return Math.round((modelBytes + mmprojBytes + drafterBytes + mtpBranchBytes) * GpuOverhead.NO_HEADER_FACTOR);
  }

  static _kvTotal({ gguf, contextSize, cacheTypeK, cacheTypeV, kvOnHost, swaFull }) {
    return kvOnHost ? 0 : KvCacheSizer.total(gguf, contextSize, cacheTypeK, cacheTypeV, swaFull);
  }

  static _draftBranch({ modelBytes, gguf, contextSize, cacheTypeK, cacheTypeV, mtpEnabled, mtpHeadBytes = 0, drafterBytes = 0, draftCacheType = null }) {
    if (!(mtpEnabled || drafterBytes > 0)) return 0;
    const kvPerLayer = KvCacheSizer.perLayer(gguf, contextSize, cacheTypeK, cacheTypeV);
    const draftKvPerLayer = draftCacheType
      ? KvCacheSizer.perLayer(gguf, contextSize, draftCacheType, draftCacheType)
      : undefined;
    return DraftBranchCost.bytes({
      modelBytes, kvPerLayer, draftKvPerLayer, drafterBytes, mtp: mtpEnabled, mtpHeadBytes,
    });
  }
}

module.exports = FullOffloadCost;
