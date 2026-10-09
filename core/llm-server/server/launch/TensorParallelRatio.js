const MemoryBandwidth = require('../../MemoryBandwidth');

class TensorParallelRatio {
  static compute(perGpu) {
    if (!Array.isArray(perGpu) || perGpu.length < 2) return null;
    const weights = TensorParallelRatio._weights(perGpu);
    const sum = weights.reduce((s, w) => s + w, 0);
    if (!(sum > 0)) return null;
    return weights.map((w) => Math.max(1, Math.round((w / sum) * 100))).join(',');
  }

  static _weights(perGpu) {
    const bandwidth = perGpu.map((g) => MemoryBandwidth.tableGpuBandwidth(g && g.name));
    if (bandwidth.every((b) => b > 0)) return bandwidth;
    return perGpu.map((g) => Math.max(1, Number(g && g.totalBytes) || 0));
  }
}

module.exports = TensorParallelRatio;
