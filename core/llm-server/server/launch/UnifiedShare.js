const ResourceBudget = require('../../diagnostics/ResourceBudget');

class UnifiedShare {
  static HOST_SLACK_BYTES = 1024 * 1024 * 1024;

  static SPAWN_ENV = Object.freeze({ GGML_CUDA_NO_PINNED: '1' });

  static roomBytes(card, ramTotalBytes) {
    const shared = Number(card && card.sharedBytes) || 0;
    if (shared <= 0) return 0;
    const ramAllowance = ResourceBudget.ramMaxBytes(ramTotalBytes) - UnifiedShare.HOST_SLACK_BYTES;
    return Math.max(0, Math.min(shared, ramAllowance));
  }

  static anyUnified(perGpu) {
    return Array.isArray(perGpu) && perGpu.some((g) => g && g.unifiedMemory === true);
  }

  static hostBytes(budget, gguf) {
    if (!budget || !budget.unifiedMemory) return 0;
    const layout = gguf && gguf.tensorLayout;
    return Math.max(0, Number(layout && layout.hostBytes) || 0);
  }

  static spawnEnv(pinnedHostOff) {
    return pinnedHostOff ? { ...UnifiedShare.SPAWN_ENV } : null;
  }
}

module.exports = UnifiedShare;
