class OomRescue {
  static NOTE = 'OOM rescue: the first start hit out-of-memory under the measured-fit estimate, so this launch was replanned with the conservative header estimate instead.';

  constructor({ placement, log }) {
    this._placement = placement;
    this._log = log;
  }

  async attempt(ctx, failure) {
    const launch = ctx.launch;
    const usedMeasured = launch.plan && launch.plan.measuredVramBytes != null;
    if (ctx.rpcAcquired || !usedMeasured || !failure || failure.kind !== 'oom') return null;
    this._log.warn('[llm-server] out-of-memory under a measured-fit plan: replanning once with the conservative estimate.');
    try { await ctx.runtimeServer.ensureStopped(); } catch (_) {}
    return this._retryConservative(ctx, launch);
  }

  async _retryConservative(ctx, launch) {
    const overrides = { ...ctx.overrides };
    delete overrides.measuredVramBytes;
    const placed = this._placement.placeForRescue(ctx, launch.plan.headerEstimatedBytes);
    const rescue = ctx.plan({ diagnostics: placed.diagnostics, overrides });
    rescue.authKey = ctx.launchKey;
    rescue.cudaDevice = placed.cudaDevice;
    rescue.healthTimeoutMs = launch.healthTimeoutMs;
    if (rescue.plan && Array.isArray(rescue.plan.notes)) rescue.plan.notes.push(OomRescue.NOTE);
    await ctx.runtimeServer.start(rescue);
    ctx.syncQueue(rescue.plan);
    return ctx.succeed(rescue.plan, { oomRescue: true });
  }
}

module.exports = OomRescue;
