const MemoryBandwidth = require('../../MemoryBandwidth');
const ByteLadder = require('../ByteLadder');
const KvCacheSizer = require('./KvCacheSizer');
const GpuOverhead = require('./GpuOverhead');

class LayerFillSplit {
  static CARD_SAFETY = 0.95;

  static compute(input) {
    const blocks = Number(input.gguf && input.gguf.blockCount) || 0;
    const layers = Math.min(blocks, Math.max(0, Math.floor(Number(input.layersOnGpu) || 0)));
    if (!LayerFillSplit._usable(input, blocks, layers)) return null;
    const extraBytes = input.extraBytes || 0;
    const budgets = LayerFillSplit._budgets(input.perGpu, input.flashAttnSupported, extraBytes);
    const costAt = LayerFillSplit._costFunction(input, blocks);
    const packed = LayerFillSplit._pack(input.perGpu, budgets, costAt, blocks - layers, blocks);
    if (!packed) return null;
    return LayerFillSplit._result(input.perGpu, packed, budgets, extraBytes);
  }

  static describe(layerFill) {
    return layerFill.perDevice
      .map((d) => `${d.name} takes ${d.layers} layer${d.layers === 1 ? '' : 's'} ≈ ${ByteLadder.format(d.bytes)} of ${ByteLadder.format(d.budgetBytes)} budget`)
      .join(', ');
  }

  static _usable({ perGpu, modelBytes }, blocks, layers) {
    return !!blocks && layers > 0 && Array.isArray(perGpu) && perGpu.length >= 2 && Number(modelBytes) > 0;
  }

  static _budgets(perGpu, flashAttnSupported, extraBytes) {
    const fixed = GpuOverhead.fixed(flashAttnSupported);
    return perGpu.map((g, i) => {
      const total = Number(g && g.totalBytes) || 0;
      const resident = g && g.freeBytes != null ? Math.max(0, total - Number(g.freeBytes)) : 0;
      return Math.max(0, (total - Math.max(GpuOverhead.PER_CARD_RESERVE, resident) - fixed) * LayerFillSplit.CARD_SAFETY - (i === 0 ? extraBytes : 0));
    });
  }

  static _costFunction({ gguf, contextSize, cacheTypeK, cacheTypeV, kvOnHost, swaFull, modelBytes }, blocks) {
    const perLayerWeight = Number(modelBytes) / blocks;
    return (i) => perLayerWeight + (kvOnHost ? 0 : KvCacheSizer.atLayer(gguf, i, contextSize, cacheTypeK, cacheTypeV, swaFull));
  }

  static _rankOf(perGpu) {
    const bandwidth = perGpu.map((g) => MemoryBandwidth.tableGpuBandwidth(g && g.name));
    const key = bandwidth.every((b) => b > 0) ? bandwidth : perGpu.map((g) => Number(g && g.totalBytes) || 0);
    const order = perGpu.map((_, i) => i).sort((a, b) => key[b] - key[a] || a - b);
    const rankOf = new Array(perGpu.length);
    order.forEach((device, rank) => { rankOf[device] = rank; });
    return rankOf;
  }

  static _pack(perGpu, budgets, costAt, first, blocks) {
    const rankOf = LayerFillSplit._rankOf(perGpu);
    let remaining = 0;
    for (let i = first; i < blocks; i++) remaining += costAt(i);
    const counts = new Array(perGpu.length).fill(0);
    const bytes = new Array(perGpu.length).fill(0);
    let layer = first;
    for (let device = 0; device < perGpu.length; device++) {
      const fasterAfter = LayerFillSplit._fasterBudgetAfter(device, rankOf, budgets);
      let budgetLeft = budgets[device];
      while (layer < blocks) {
        const cost = costAt(layer);
        if (cost > budgetLeft + 1) break;
        if (fasterAfter > 0 && remaining - fasterAfter <= 1) break;
        counts[device] += 1; bytes[device] += cost; budgetLeft -= cost; remaining -= cost; layer += 1;
      }
    }
    if (layer < blocks || !counts.some((c) => c > 0)) return null;
    return { counts, bytes };
  }

  static _fasterBudgetAfter(device, rankOf, budgets) {
    let sum = 0;
    for (let j = device + 1; j < budgets.length; j++) if (rankOf[j] < rankOf[device]) sum += budgets[j];
    return sum;
  }

  static _result(perGpu, { counts, bytes }, budgets, extraBytes) {
    return {
      ratio: counts.join(','),
      perDevice: perGpu.map((g, i) => ({
        index: i,
        name: (g && g.name) || `GPU ${i}`,
        layers: counts[i],
        bytes: Math.round(bytes[i] + (i === 0 ? extraBytes : 0)),
        budgetBytes: Math.round(budgets[i] + (i === 0 ? extraBytes : 0)),
      })),
    };
  }
}

module.exports = LayerFillSplit;
