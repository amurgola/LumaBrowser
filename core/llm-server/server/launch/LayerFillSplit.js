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
    const slowFirst = input.slowFirst ? LayerFillSplit._slowFirstOrder(input.perGpu) : null;
    const order = slowFirst || input.perGpu.map((_, i) => i);
    const mainDevice = slowFirst ? order[order.length - 1] : 0;
    const budgets = LayerFillSplit._budgets(input.perGpu, input.flashAttnSupported, extraBytes, input.perCardExtraBytes || 0, mainDevice);
    const costAt = LayerFillSplit._costFunction(input, blocks);
    const packed = LayerFillSplit._pack(input.perGpu, budgets, costAt, blocks - layers, blocks, order);
    if (!packed) return null;
    const result = {
      ratio: LayerFillSplit._ratio(packed.counts, order, layers === blocks),
      perDevice: LayerFillSplit._perDevice(input.perGpu, packed, budgets, extraBytes, mainDevice),
    };
    return slowFirst ? { ...result, order, mainDevice } : result;
  }

  static budgetTotal(perGpu, flashAttnSupported, perCardExtraBytes = 0) {
    if (!Array.isArray(perGpu) || !perGpu.length) return 0;
    return LayerFillSplit._budgets(perGpu, flashAttnSupported, 0, perCardExtraBytes, 0).reduce((s, b) => s + b, 0);
  }

  static describe(layerFill) {
    return layerFill.perDevice
      .map((d) => `${d.name} takes ${d.layers} layer${d.layers === 1 ? '' : 's'} ≈ ${ByteLadder.format(d.bytes)} of ${ByteLadder.format(d.budgetBytes)} budget`)
      .join(', ');
  }

  static _usable({ perGpu, modelBytes }, blocks, layers) {
    return !!blocks && layers > 0 && Array.isArray(perGpu) && perGpu.length >= 2 && Number(modelBytes) > 0;
  }

  static _budgets(perGpu, flashAttnSupported, extraBytes, perCardExtraBytes, mainDevice) {
    const fixed = GpuOverhead.fixed(flashAttnSupported);
    return perGpu.map((g, i) => {
      const total = Number(g && g.totalBytes) || 0;
      const cachedResident = g && g.freeBytes != null ? Math.max(0, total - Number(g.freeBytes)) : 0;
      return Math.max(0, (GpuOverhead.cardRoom(g, { cachedResident }) - fixed) * LayerFillSplit.CARD_SAFETY
        - perCardExtraBytes - (i === mainDevice ? extraBytes : 0));
    });
  }

  static _costFunction({ gguf, contextSize, cacheTypeK, cacheTypeV, kvOnHost, swaFull, modelBytes }, blocks) {
    const perLayerWeight = Number(modelBytes) / blocks;
    return (i) => perLayerWeight + (kvOnHost ? 0 : KvCacheSizer.atLayer(gguf, i, contextSize, cacheTypeK, cacheTypeV, swaFull));
  }

  static _speedKeys(perGpu) {
    const bandwidth = perGpu.map((g) => MemoryBandwidth.tableGpuBandwidth(g && g.name));
    return bandwidth.every((b) => b > 0) ? bandwidth : perGpu.map((g) => Number(g && g.totalBytes) || 0);
  }

  static _rankOf(perGpu) {
    const key = LayerFillSplit._speedKeys(perGpu);
    const order = perGpu.map((_, i) => i).sort((a, b) => key[b] - key[a] || a - b);
    const rankOf = new Array(perGpu.length);
    order.forEach((device, rank) => { rankOf[device] = rank; });
    return rankOf;
  }

  static _slowFirstOrder(perGpu) {
    const key = LayerFillSplit._speedKeys(perGpu);
    if (perGpu.some((g) => g && g.remote) || key.every((k) => k === key[0])) return null;
    return perGpu.map((_, i) => i).sort((a, b) => key[a] - key[b] || a - b);
  }

  static _pack(perGpu, budgets, costAt, first, blocks, order) {
    const rankOf = LayerFillSplit._rankOf(perGpu);
    let remaining = 0;
    for (let i = first; i < blocks; i++) remaining += costAt(i);
    const counts = new Array(perGpu.length).fill(0);
    const bytes = new Array(perGpu.length).fill(0);
    let layer = first;
    for (let position = 0; position < order.length; position++) {
      const device = order[position];
      const fasterAfter = LayerFillSplit._fasterBudgetAfter(position, order, rankOf, budgets);
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

  static _fasterBudgetAfter(position, order, rankOf, budgets) {
    let sum = 0;
    for (let j = position + 1; j < order.length; j++) {
      if (rankOf[order[j]] < rankOf[order[position]]) sum += budgets[order[j]];
    }
    return sum;
  }

  static _ratio(counts, order, fullOffload) {
    const units = order.map((device) => counts[device]);
    if (fullOffload) units[units.findLastIndex((count) => count > 0)] += 1;
    return units.join(',');
  }

  static _perDevice(perGpu, { counts, bytes }, budgets, extraBytes, mainDevice) {
    return perGpu.map((g, i) => ({
      index: i,
      name: (g && g.name) || `GPU ${i}`,
      layers: counts[i],
      bytes: Math.round(bytes[i] + (i === mainDevice ? extraBytes : 0)),
      budgetBytes: Math.round(budgets[i] + (i === mainDevice ? extraBytes : 0)),
    }));
  }
}

module.exports = LayerFillSplit;
