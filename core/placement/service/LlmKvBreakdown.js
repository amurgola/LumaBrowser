const KvCacheSizer = require('../../llm-server/server/launch/KvCacheSizer');

class LlmKvBreakdown {
  static fromStatus(status) {
    const plan = status && status.plan;
    const gguf = plan && plan.gguf;
    const contextSize = plan && Number(plan.contextSize);
    if (!gguf || !Number.isFinite(contextSize) || contextSize <= 0) return null;
    if (!(Number(gguf.blockCount) > 0)) return null;
    const totalKvBytes = KvCacheSizer.total(gguf, contextSize, plan.cacheTypeK, plan.cacheTypeV, plan.swaFull);
    if (!Number.isFinite(totalKvBytes) || totalKvBytes <= 0) return null;
    return { totalKvBytes, contextSize };
  }
}

module.exports = LlmKvBreakdown;
