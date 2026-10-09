class SlotPlan {
  static CACHE_REUSE_MIN_CHUNK = 256;

  static resolve({ overrides, flags }) {
    const parsed = Math.floor(Number(overrides.maxConcurrent));
    const requestedConcurrent = (Number.isFinite(parsed) && parsed >= 1) ? parsed : 1;
    const parallelEnabled = flags.parallel && requestedConcurrent > 1;
    const cacheReuseRequested = !!overrides.cacheReuse;
    return {
      requestedConcurrent,
      parallelEnabled,
      maxConcurrent: parallelEnabled ? requestedConcurrent : 1,
      cacheReuseRequested,
      cacheReuseEnabled: cacheReuseRequested && flags.cacheReuse,
    };
  }
}

module.exports = SlotPlan;
