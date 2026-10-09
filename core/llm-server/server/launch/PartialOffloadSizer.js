const KvCacheSizer = require('./KvCacheSizer');
const GpuOverhead = require('./GpuOverhead');
const DraftBranchCost = require('./DraftBranchCost');

class PartialOffloadSizer {
  static SAFETY = 0.9;

  static size(input) {
    const blocks = input.gguf.blockCount;
    const perLayerWeight = input.modelBytes / blocks;
    const kvPerLayer = PartialOffloadSizer._kvPerLayer(input, blocks);
    const perLayer = perLayerWeight + kvPerLayer;
    const fixedOverhead = GpuOverhead.fixed(input.flashAttnSupported);
    const draftOverhead = PartialOffloadSizer._draftOverhead(input);
    const budget = (input.vramAvailableBytes - fixedOverhead - (input.mmprojBytes || 0) - draftOverhead) * PartialOffloadSizer.SAFETY;
    return {
      ngl: PartialOffloadSizer._layersThatFit(budget, perLayer, blocks),
      layerCount: blocks,
      perLayerBytes: Math.round(perLayer),
      perLayerWeightBytes: Math.round(perLayerWeight),
      kvPerLayerBytes: Math.round(kvPerLayer),
      budgetBytes: Math.round(budget),
      mtpOverheadBytes: Math.round(draftOverhead),
      fixedOverheadBytes: fixedOverhead,
    };
  }

  static _kvPerLayer({ gguf, contextSize, cacheTypeK, cacheTypeV, kvOnHost }, blocks) {
    return kvOnHost ? 0 : KvCacheSizer.total(gguf, contextSize, cacheTypeK, cacheTypeV, false) / blocks;
  }

  static _draftOverhead({ gguf, modelBytes, contextSize, cacheTypeK, cacheTypeV, mtpEnabled, mtpHeadBytes = 0, drafterBytes = 0 }) {
    if (!(mtpEnabled || drafterBytes > 0)) return 0;
    return DraftBranchCost.bytes({
      modelBytes, drafterBytes, mtp: mtpEnabled, mtpHeadBytes,
      kvPerLayer: KvCacheSizer.perLayer(gguf, contextSize, cacheTypeK, cacheTypeV),
    });
  }

  static _layersThatFit(budget, perLayer, blocks) {
    let ngl = Math.floor(budget / perLayer);
    if (!Number.isFinite(ngl) || ngl < 0) ngl = 0;
    if (ngl > blocks - 1) ngl = blocks - 1;
    return ngl;
  }
}

module.exports = PartialOffloadSizer;
