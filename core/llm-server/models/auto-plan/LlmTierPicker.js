const FitVramMath = require('../FitVramMath');
const AutoPlanRanking = require('./AutoPlanRanking');

const R = AutoPlanRanking;

class LlmTierPicker {
  static pick(models, machine, hw, { cpuMoeSupported = true } = {}) {
    let pick = machine.gpu ? LlmTierPicker._gpuPick(models, machine, cpuMoeSupported) : null;
    if (!pick && machine.gpu) pick = LlmTierPicker.partial(models, machine.ramUsable, true);
    if (!pick) pick = LlmTierPicker.cpu(models, machine.ramUsable, hw);
    return pick;
  }

  static fullVram(models, vramBudget) {
    if (!(vramBudget > R.MIN_GPU_BUDGET)) return null;
    return LlmTierPicker._firstFit(R.capableFirst(models), vramBudget, {
      admits: () => true,
      gpuBytesOf: (variant) => variant.approxBytes,
      extra: { mode: 'gpu' },
    });
  }

  static moeOffload(models, vramBudget, ramBudget) {
    if (!(vramBudget > R.MIN_GPU_BUDGET)) return null;
    return LlmTierPicker._firstFit(R.capableFirst(models.filter((m) => m.moe)), vramBudget, {
      admits: (variant) => variant.approxBytes <= ramBudget * R.RAM_HEADROOM,
      gpuBytesOf: (variant) => variant.approxBytes * R.MOE_RESIDENT_FRACTION,
      extra: { mode: 'moe-cpu', cpuMoe: true },
    });
  }

  static partial(models, ramBudget, hasGpu) {
    const fitting = R.capableFirst(models).find((m) => LlmTierPicker._q4FitsRam(m, ramBudget * R.RAM_HEADROOM));
    if (fitting) return LlmTierPicker._q4Pick(fitting, 16384, hasGpu ? 'partial' : 'cpu');
    const floor = R.smallestFirst(models)[0];
    return floor ? LlmTierPicker._q4Pick(floor, 8192, 'cpu') : null;
  }

  static cpu(models, ramBudget, hw) {
    const fits = (m) => LlmTierPicker._q4FitsRam(m, ramBudget * R.CPU_RAM_HEADROOM);
    const moe = R.capableFirst(models.filter((m) => m.moe && fits(m)))[0] || null;
    const dense = R.capableFirst(models.filter((m) => !m.moe && fits(m)))[0] || null;
    const chosen = LlmTierPicker._fasterOf(moe, dense, hw) || R.smallestFirst(models)[0];
    return chosen ? LlmTierPicker._q4Pick(chosen, 16384, 'cpu') : null;
  }

  static _gpuPick(models, machine, cpuMoeSupported) {
    const resident = LlmTierPicker.fullVram(models, machine.vramTotal);
    if (!cpuMoeSupported || (resident && R.tierOf(resident) >= R.TIER_RANK.large)) return resident;
    const sparse = LlmTierPicker.moeOffload(models, machine.vramTotal, machine.ramUsable);
    if (sparse && (!resident || R.tierOf(sparse) > R.tierOf(resident))) return sparse;
    return resident;
  }

  static _firstFit(models, vramBudget, { admits, gpuBytesOf, extra }) {
    for (const model of models) {
      for (const quant of R.quantsBestFirst()) {
        const variant = model.variants && model.variants[quant];
        if (!variant || !admits(variant)) continue;
        const pick = LlmTierPicker._firstContextFit(model, quant, variant, gpuBytesOf(variant), vramBudget);
        if (pick) return { ...pick, ...extra };
      }
    }
    return null;
  }

  static _firstContextFit(model, quant, variant, gpuBytes, vramBudget) {
    for (const contextSize of R.CTX_LADDER) {
      if (contextSize > model.maxContext) continue;
      for (const kvCacheType of R.KV_LADDER) {
        const need = gpuBytes + FitVramMath.kvBytes(model.paramsB, contextSize, kvCacheType) + FitVramMath.GPU_OVERHEAD;
        if (need <= vramBudget) {
          return { model, quant, contextSize, kvCacheType, vramNeedBytes: need, weightsBytes: variant.approxBytes };
        }
      }
    }
    return null;
  }

  static _fasterOf(moe, dense, hw) {
    if (!moe || !dense) return moe || dense;
    const moeTps = R.predictedTps(moe, 'Q4_K_M', hw);
    const denseTps = R.predictedTps(dense, 'Q4_K_M', hw);
    return (moeTps != null && denseTps != null && denseTps > moeTps) ? dense : moe;
  }

  static _q4FitsRam(model, ramAllowance) {
    const q4 = model.variants && model.variants.Q4_K_M;
    return !!(q4 && q4.approxBytes <= ramAllowance);
  }

  static _q4Pick(model, contextSize, mode) {
    return {
      model,
      quant: 'Q4_K_M',
      contextSize,
      kvCacheType: 'f16',
      vramNeedBytes: null,
      weightsBytes: (model.variants.Q4_K_M || {}).approxBytes || 0,
      mode,
    };
  }
}

module.exports = LlmTierPicker;
