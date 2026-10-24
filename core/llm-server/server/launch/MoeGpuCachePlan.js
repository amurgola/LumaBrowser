class MoeGpuCachePlan {
  static MIB = 1024 * 1024;

  static MIN_BYTES = 1024 * MoeGpuCachePlan.MIB;

  static MIN_CPU_SHARE = 0.2;

  static MIN_SLOTS_PER_CARD_FACTOR = 4;

  static resolve(input) {
    const off = MoeGpuCachePlan._offReason(input);
    if (off) return { enabled: false, bytes: 0, mib: 0, reason: off };
    const bytes = Math.min(Math.floor(input.fillBudget), Math.ceil(input.expertBytes));
    if (bytes < MoeGpuCachePlan._floorBytes(input)) {
      return { enabled: false, bytes: 0, mib: 0, reason: 'too little spare VRAM for a useful expert cache' };
    }
    const mib = Math.floor(bytes / MoeGpuCachePlan.MIB);
    return { enabled: true, bytes: mib * MoeGpuCachePlan.MIB, mib, reason: null };
  }

  static _offReason({ overrides, flags, budget, gguf, expertBytes, cpuExpertBytes }) {
    if (overrides.noMoeGpuCache) return 'turned off in Setup';
    if (!flags.moeCache) return 'this runtime build has no --moe-cache-mib';
    if (budget.rpcEnabled) return 'not used with peer GPUs over RPC';
    if (overrides.tensorSplitMode) return 'llama.cpp does not support it with --split-mode tensor';
    const cards = MoeGpuCachePlan._localCards(budget);
    if (cards === 0) return 'no local GPU';
    if (cards > 1 && !flags.moeCacheMultiGpu) return 'this runtime build caches on one GPU only';
    if (!(Number(gguf && gguf.expertCount) > 0 && Number(gguf && gguf.expertUsedCount) > 0)) return 'the header has no expert counts';
    if (!(expertBytes > 0) || cpuExpertBytes / expertBytes < MoeGpuCachePlan.MIN_CPU_SHARE) {
      return 'the GPUs already hold most experts as whole layers';
    }
    return null;
  }

  static _localCards(budget) {
    return (budget.perGpu || []).filter((g) => g && !g.remote).length;
  }

  static _floorBytes({ budget, gguf, maxExpertSliceBytes }) {
    const perCard = (Number(gguf.expertUsedCount) + 1) * (Number(maxExpertSliceBytes) || 0) * MoeGpuCachePlan.MIN_SLOTS_PER_CARD_FACTOR;
    return Math.max(MoeGpuCachePlan.MIN_BYTES, perCard * MoeGpuCachePlan._localCards(budget));
  }
}

module.exports = MoeGpuCachePlan;
