class OomRescue {
  static NOTE = 'OOM rescue: the first start hit out-of-memory under the measured-fit estimate, so this launch was replanned with the conservative header estimate instead.';

  static MOE_CACHE_NOTE = 'MoE GPU cache rescue: the first start with --moe-cache-mib failed, so this launch was replanned without the cache (whole layers of experts on the GPU).';

  constructor({ placement, log }) {
    this._placement = placement;
    this._log = log;
  }

  async attempt(ctx, failure) {
    const launch = ctx.launch;
    const usedMoeCache = launch.plan && launch.plan.moeGpuCacheMib != null;
    if (usedMoeCache && !ctx.rpcAcquired && !(failure && failure.kind === 'unknown-flag')) return this._retryWithoutMoeCache(ctx, launch);
    const usedMeasured = launch.plan && launch.plan.measuredVramBytes != null;
    if (ctx.rpcAcquired || !usedMeasured || !failure || failure.kind !== 'oom') return null;
    this._log.warn('[llm-server] out-of-memory under a measured-fit plan: replanning once with the conservative estimate.');
    try { await ctx.runtimeServer.ensureStopped(); } catch (_) {}
    return this._retryConservative(ctx, launch);
  }

  async _retryWithoutMoeCache(ctx, launch) {
    this._log.warn('[llm-server] start failed with the MoE GPU cache on: replanning once without it.');
    try { await ctx.runtimeServer.ensureStopped(); } catch (_) {}
    return this._retryConservative(ctx, launch, { overrides: { noMoeGpuCache: true }, note: OomRescue.MOE_CACHE_NOTE, flag: 'moeCacheRescue' });
  }

  async _retryConservative(ctx, launch, { overrides: extra = {}, note = OomRescue.NOTE, flag = 'oomRescue' } = {}) {
    const overrides = { ...ctx.overrides, ...extra };
    delete overrides.measuredVramBytes;
    const placed = this._placement.placeForRescue(ctx, launch.plan.headerEstimatedBytes);
    const rescue = ctx.plan({ diagnostics: placed.diagnostics, overrides });
    rescue.authKey = ctx.launchKey;
    rescue.cudaDevice = placed.cudaDevice;
    rescue.healthTimeoutMs = launch.healthTimeoutMs;
    if (rescue.plan && Array.isArray(rescue.plan.notes)) rescue.plan.notes.push(note);
    await ctx.runtimeServer.start(rescue);
    ctx.syncQueue(rescue.plan);
    return ctx.succeed(rescue.plan, { [flag]: true });
  }
}

module.exports = OomRescue;
