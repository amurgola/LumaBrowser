class SlotPlan {
  static CACHE_REUSE_MIN_CHUNK = 256;

  static UNSHIFTABLE_ARCHITECTURES = new Set([
    'qwen2vl', 'paddleocr', 'qwen3vl', 'qwen3vlmoe', 'qwen35', 'qwen35moe', 'clef', 'qwen4exp', 'qwen3tts',
    'step35', 'deepseek4', 'deepseek41',
  ]);

  static resolve({ overrides, flags, files, vision }) {
    const parsed = Math.floor(Number(overrides.maxConcurrent));
    const requestedConcurrent = (Number.isFinite(parsed) && parsed >= 1) ? parsed : 1;
    const parallelEnabled = flags.parallel && requestedConcurrent > 1;
    const cacheReuseRequested = !!overrides.cacheReuse;
    const cacheReuseOffReason = cacheReuseRequested ? SlotPlan._cacheReuseOffReason(flags, files, vision) : null;
    return {
      requestedConcurrent,
      parallelEnabled,
      maxConcurrent: parallelEnabled ? requestedConcurrent : 1,
      cacheReuseRequested,
      cacheReuseEnabled: cacheReuseRequested && !cacheReuseOffReason,
      cacheReuseOffReason,
    };
  }

  static _cacheReuseOffReason(flags, files, vision) {
    if (!flags.cacheReuse) return 'runtime';
    if (SlotPlan.UNSHIFTABLE_ARCHITECTURES.has(SlotPlan._architecture(files))) return 'architecture';
    if (vision.effectiveMmprojPath) return 'projector';
    return null;
  }

  static _architecture(files) {
    return String((files.gguf && files.gguf.architecture) || '').toLowerCase().trim();
  }
}

module.exports = SlotPlan;
