const CuratedModelCatalog = require('../CuratedModelCatalog');
const FitVramMath = require('../FitVramMath');
const CatalogDecodeEstimator = require('../../server/decode/CatalogDecodeEstimator');

class AutoPlanRanking {
  static GB = 1024 * 1024 * 1024;

  static CTX_LADDER = [32768, 16384, 8192];

  static KV_LADDER = ['f16', 'q8_0'];

  static TIER_RANK = { small: 0, mid: 1, large: 2, xl: 3 };

  static MOE_RESIDENT_FRACTION = 0.15;

  static RAM_HEADROOM = 0.85;

  static CPU_RAM_HEADROOM = 0.8;

  static MIN_GPU_BUDGET = 1.5 * AutoPlanRanking.GB;

  static tierRankOf(model) {
    return AutoPlanRanking.TIER_RANK[model.tier] || 0;
  }

  static tierOf(pick) {
    return pick ? AutoPlanRanking.tierRankOf(pick.model) : -1;
  }

  static capableFirst(models) {
    return models.slice().sort((a, b) => {
      const byTier = AutoPlanRanking.tierRankOf(b) - AutoPlanRanking.tierRankOf(a);
      if (byTier) return byTier;
      return b.paramsB - a.paramsB;
    });
  }

  static smallestFirst(models) {
    return models.slice().sort((a, b) => a.paramsB - b.paramsB);
  }

  static quantsBestFirst() {
    return CuratedModelCatalog.QUANT_ORDER.slice().reverse();
  }

  static modelScore(pick) {
    if (!pick) return -1;
    return (AutoPlanRanking.tierRankOf(pick.model) * 1e6)
      + (pick.model.paramsB * 1e3)
      + (CuratedModelCatalog.QUANT_ORDER.indexOf(pick.quant) * 10)
      + AutoPlanRanking.CTX_LADDER.length - AutoPlanRanking.CTX_LADDER.indexOf(pick.contextSize);
  }

  static vramNeedOf(pick) {
    if (!pick) return null;
    if (pick.mode === 'gpu') return pick.vramNeedBytes;
    if (pick.mode === 'moe-cpu') {
      return (pick.weightsBytes * AutoPlanRanking.MOE_RESIDENT_FRACTION)
        + FitVramMath.kvBytes(pick.model.paramsB, pick.contextSize, pick.kvCacheType)
        + FitVramMath.GPU_OVERHEAD;
    }
    return null;
  }

  static predictedTps(model, quant, hw) {
    const variant = model && model.variants && model.variants[quant];
    if (!variant || !hw) return null;
    const estimate = CatalogDecodeEstimator.estimate({
      approxBytes: variant.approxBytes,
      paramsB: model.paramsB,
      activeParamsB: model.moe && model.moe.activeParamsB,
      maxContext: model.maxContext,
    }, hw);
    return estimate && estimate.at8k > 0 ? estimate.at8k : null;
  }
}

module.exports = AutoPlanRanking;
