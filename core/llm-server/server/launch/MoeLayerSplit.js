const KvCacheSizer = require('./KvCacheSizer');
const HybridAttentionLayout = require('./HybridAttentionLayout');
const GpuOverhead = require('./GpuOverhead');

class MoeLayerSplit {
  static CARD_SAFETY = 0.92;

  static balance(input) {
    const blocks = Number(input.gguf && input.gguf.blockCount) || 0;
    if (!MoeLayerSplit._usable(input, blocks)) return null;
    const costAt = MoeLayerSplit._costFunction(input, blocks);
    const budgets = MoeLayerSplit._budgets(input.perGpu);
    for (let n = Math.max(0, input.nCpuMoe); n <= blocks; n++) {
      const counts = MoeLayerSplit._pack(n, blocks, costAt, budgets);
      if (!counts) continue;
      if (n >= blocks) return null;
      return { ratio: counts.join(','), nCpuMoe: n };
    }
    return null;
  }

  static _usable({ expertBytesAt, residentBytesAt, perGpu }, blocks) {
    return !!blocks && typeof expertBytesAt === 'function' && typeof residentBytesAt === 'function'
      && Array.isArray(perGpu) && perGpu.length >= 2;
  }

  static _costFunction({ gguf, contextSize, cacheTypeK, cacheTypeV, kvOnHost, expertBytesAt, residentBytesAt }, blocks) {
    const kvTotal = kvOnHost ? 0 : KvCacheSizer.total(gguf, contextSize, cacheTypeK, cacheTypeV, false);
    const hybrid = HybridAttentionLayout.of(gguf);
    const kvAt = hybrid
      ? (i) => (hybrid.hasKvAt(i) ? kvTotal / hybrid.kvLayers : 0)
      : () => kvTotal / blocks;
    return (i, n) => residentBytesAt(i) + kvAt(i) + (i >= n ? expertBytesAt(i) : 0);
  }

  static _budgets(perGpu) {
    const fixedShare = GpuOverhead.FIXED / perGpu.length;
    return perGpu.map((g) => Math.max(
      0, ((Number(g && g.totalBytes) || 0) - GpuOverhead.PER_CARD_RESERVE - fixedShare) * MoeLayerSplit.CARD_SAFETY,
    ));
  }

  static _pack(n, blocks, costAt, budgets) {
    const counts = new Array(budgets.length).fill(0);
    let device = 0;
    let remaining = budgets[0];
    for (let i = 0; i < blocks; i++) {
      const cost = costAt(i, n);
      while (cost > remaining) {
        device += 1;
        if (device >= budgets.length) return null;
        remaining = budgets[device];
      }
      counts[device] += 1;
      remaining -= cost;
    }
    return counts;
  }
}

module.exports = MoeLayerSplit;
