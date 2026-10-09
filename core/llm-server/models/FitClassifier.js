const FitVramMath = require('./FitVramMath');
const CatalogDecodeEstimator = require('../server/decode/CatalogDecodeEstimator');
const DecodeFormula = require('../server/decode/DecodeFormula');

class FitClassifier {
  static MIN_GPU_BYTES = 1.5 * FitVramMath.GB;

  static TIGHT_FACTOR = 1.1;

  static CPU_COMFORT_FRACTION = 0.9;

  static SPEED_DEPTH = 8192;

  static TOO_BIG = { tier: 'too-big', badge: 'red', label: 'Too large for this machine' };

  static classify(variant, hw) {
    return FitClassifier._withSpeed(FitClassifier._tier(variant, hw), variant, hw);
  }

  static _tier(variant, hw) {
    const weights = Number(variant && variant.approxBytes) || 0;
    const vram = Math.max(0, Number(hw && hw.usableVramBytes) || 0);
    const ram = Math.max(0, Number(hw && hw.usableRamBytes) || 0);
    if (vram > FitClassifier.MIN_GPU_BYTES) {
      const need = weights + FitVramMath.kvBytesAt8k(variant && variant.paramsB) + FitVramMath.GPU_OVERHEAD;
      return FitClassifier._gpuTier(need, weights, vram, ram);
    }
    return FitClassifier._cpuTier(weights, ram);
  }

  static _gpuTier(need, weights, vram, ram) {
    if (need <= vram) return { tier: 'fits', badge: 'green', label: 'Fits your GPU' };
    if (need <= vram * FitClassifier.TIGHT_FACTOR) return { tier: 'tight', badge: 'amber', label: 'Tight fit, may need a smaller context' };
    if (weights <= ram) return { tier: 'spill', badge: 'orange', label: 'Spills into system RAM, slower' };
    return { ...FitClassifier.TOO_BIG };
  }

  static _cpuTier(weights, ram) {
    if (weights <= ram * FitClassifier.CPU_COMFORT_FRACTION) return { tier: 'spill', badge: 'orange', label: 'Runs on CPU, slower' };
    if (weights <= ram) return { tier: 'tight', badge: 'amber', label: 'Tight on RAM, may be unstable' };
    return { ...FitClassifier.TOO_BIG };
  }

  static _withSpeed(verdict, variant, hw) {
    const speed = verdict.tier === 'too-big' ? null : CatalogDecodeEstimator.estimate(variant, hw);
    const tps = speed && speed.at8k > 0 ? speed.at8k : null;
    return {
      ...verdict,
      predictedTps: tps,
      predictedTpsDepth: tps != null ? FitClassifier.SPEED_DEPTH : null,
      speedLabel: tps != null ? `${DecodeFormula.describeTps(tps)} predicted` : '',
    };
  }
}

module.exports = FitClassifier;
