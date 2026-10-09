const HardwareTiers = require('../../../shared/HardwareTiers');

class AutoPlanMachine {
  static describe(hw, devices) {
    const vramTotal = AutoPlanMachine._bytes(hw && hw.usableVramBytes);
    const gpu = vramTotal > HardwareTiers.minGpuBytes();
    const cards = AutoPlanMachine._cardBudgets(hw, gpu, vramTotal);
    const cudaCards = Array.isArray(devices) ? devices.filter((d) => d && Number.isInteger(d.index)) : [];
    return {
      vramTotal,
      ramUsable: AutoPlanMachine._bytes(hw && hw.usableRamBytes),
      ramTotal: AutoPlanMachine._bytes(hw && hw.ramTotalBytes),
      gpu,
      tier: HardwareTiers.classify(hw),
      cards,
      largestCardBytes: cards.length ? Math.max(...cards) : 0,
      cudaCards,
      largestCudaCard: AutoPlanMachine._largestCuda(cudaCards),
    };
  }

  static _cardBudgets(hw, gpu, vramTotal) {
    if (hw && Array.isArray(hw.gpus) && hw.gpus.length) return hw.gpus.map((g) => AutoPlanMachine._bytes(g.maxBytes));
    return gpu ? [vramTotal] : [];
  }

  static _largestCuda(cudaCards) {
    return cudaCards.slice().sort((a, b) => (b.totalBytes || 0) - (a.totalBytes || 0))[0] || null;
  }

  static _bytes(value) {
    return Math.max(0, Number(value) || 0);
  }
}

module.exports = AutoPlanMachine;
