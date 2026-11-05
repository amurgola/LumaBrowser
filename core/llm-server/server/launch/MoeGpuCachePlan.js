class MoeGpuCachePlan {
  static MIB = 1024 * 1024;

  static MIN_BYTES = 1024 * MoeGpuCachePlan.MIB;

  static MIN_CPU_SHARE = 0.2;

  static MIN_SLOTS_PER_CARD_FACTOR = 4;

  static PROMPT_BATCH = 4096;

  static PROMPT_TOKEN_BYTES = 256 * 1024;
  static PROMPT_BATCH_STEPS = [4096, 2048, 1024, 512];
  static MAX_PROMPT_RESERVE_SHARE = 0.35;

  static resolve(input) {
    const off = MoeGpuCachePlan._offReason(input);
    if (off) return MoeGpuCachePlan._off(off);
    const prompt = MoeGpuCachePlan.promptReserve(input);
    const bytes = Math.min(Math.floor(input.fillBudget - prompt.reserveBytes), Math.ceil(input.expertBytes));
    if (bytes < MoeGpuCachePlan._floorBytes(input)) return MoeGpuCachePlan._off('too little spare VRAM for a useful expert cache');
    const mib = Math.floor(bytes / MoeGpuCachePlan.MIB);
    return {
      enabled: true, bytes: mib * MoeGpuCachePlan.MIB, mib, reason: null,
      promptBatch: prompt.batch > 512 ? prompt.batch : null, promptBufferBytes: prompt.bufferBytes, promptReserveBytes: prompt.reserveBytes,
    };
  }

  static _off(reason) {
    return { enabled: false, bytes: 0, mib: 0, promptBatch: null, promptBufferBytes: 0, promptReserveBytes: 0, reason };
  }

  static promptReserve({ fillBudget, budget }) {
    const cards = Math.max(1, MoeGpuCachePlan._localCards(budget));
    const limit = Math.max(0, Number(fillBudget) || 0) * MoeGpuCachePlan.MAX_PROMPT_RESERVE_SHARE;
    const steps = MoeGpuCachePlan.PROMPT_BATCH_STEPS;
    let batch = steps[steps.length - 1];
    for (const step of steps) {
      if (step * MoeGpuCachePlan.PROMPT_TOKEN_BYTES * cards <= limit) { batch = step; break; }
    }
    const bufferBytes = batch * MoeGpuCachePlan.PROMPT_TOKEN_BYTES;
    return { batch, bufferBytes, reserveBytes: bufferBytes * cards };
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
    return Math.max(MoeGpuCachePlan.MIN_BYTES, MoeGpuCachePlan._perCardSlotBytes(gguf, maxExpertSliceBytes) * MoeGpuCachePlan._localCards(budget));
  }

  static floorBytesPerCard(gguf, maxExpertSliceBytes) {
    return Math.max(MoeGpuCachePlan.MIN_BYTES, MoeGpuCachePlan._perCardSlotBytes(gguf, maxExpertSliceBytes));
  }

  static _perCardSlotBytes(gguf, maxExpertSliceBytes) {
    return (Number(gguf.expertUsedCount) + 1) * (Number(maxExpertSliceBytes) || 0) * MoeGpuCachePlan.MIN_SLOTS_PER_CARD_FACTOR;
  }
}

module.exports = MoeGpuCachePlan;
