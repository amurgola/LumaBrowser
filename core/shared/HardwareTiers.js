const TIERS = require('./hardwareTiers.json');

class HardwareTiers {
  static TIERS = TIERS;
  static GIB = 1024 * 1024 * 1024;
  static DEFAULT_MIN_GPU_GIB = 1.5;

  static minGpuBytes() {
    return (Number(TIERS.minGpuGiB) || HardwareTiers.DEFAULT_MIN_GPU_GIB) * HardwareTiers.GIB;
  }

  static classify(hw) {
    const largestBytes = HardwareTiers._largestCardBytes(hw);
    const tier = HardwareTiers._pickTier(hw, largestBytes) || TIERS.tiers[0];
    return HardwareTiers._describe(tier, largestBytes);
  }

  static _largestCardBytes(hw) {
    const cards = HardwareTiers._cardSizes(hw);
    if (cards.length) return Math.max(...cards);
    return Number(hw && hw.vramTotalBytes) || Number(hw && hw.usableVramBytes) || 0;
  }

  static _cardSizes(hw) {
    const gpus = hw && Array.isArray(hw.gpus) ? hw.gpus : [];
    return gpus.map((g) => Number(g && (g.totalBytes || g.maxBytes)) || 0).filter((bytes) => bytes > 0);
  }

  static _pickTier(hw, largestBytes) {
    if (hw && hw.unifiedMemory) {
      const ramGiB = (Number(hw.ramTotalBytes) || 0) / HardwareTiers.GIB;
      return TIERS.tiers.find((t) => HardwareTiers._inRange(ramGiB, t.match, 'unifiedMemoryMinGiB', 'unifiedMemoryMaxGiB'));
    }
    const hasGpu = largestBytes > HardwareTiers.minGpuBytes();
    const vramGiB = hasGpu ? largestBytes / HardwareTiers.GIB : 0;
    return TIERS.tiers.find((t) => HardwareTiers._inRange(vramGiB, t.match, 'minVramGiB', 'maxVramGiB'));
  }

  static _inRange(value, match, minKey, maxKey) {
    const bounds = match || {};
    const aboveMin = bounds[minKey] == null || value >= bounds[minKey];
    const belowMax = bounds[maxKey] == null || value < bounds[maxKey];
    return aboveMin && belowMax;
  }

  static _describe(tier, largestBytes) {
    return {
      id: tier.id,
      name: tier.name,
      yourMachine: tier.yourMachine,
      whatYouGet: tier.whatYouGet,
      speedFeel: tier.speedFeel,
      downloadGiB: tier.downloadGiB,
      diskFreeGiB: tier.diskFreeGiB,
      largestCardGiB: Math.round(largestBytes / HardwareTiers.GIB),
    };
  }
}

module.exports = HardwareTiers;
