class LaunchFinalizer {
  static HEALTH_TIMEOUT_MIN_MS = 5 * 60 * 1000;
  static HEALTH_TIMEOUT_MAX_MS = 20 * 60 * 1000;
  static HEALTH_WARMUP_MS = 120 * 1000;
  static LOAD_BYTES_PER_SEC = 200e6;

  constructor({ vram }) {
    this._vram = vram;
  }

  finalize(ctx, launch) {
    launch.authKey = ctx.launchKey;
    launch.cudaDevice = ctx.cudaDevice;
    launch.healthTimeoutMs = LaunchFinalizer.healthTimeoutMs(ctx.model.weightsTotalBytes);
    LaunchFinalizer._applyLayoutSplit(ctx, launch);
    this._weightLedgerBySplit(launch);
    return launch;
  }

  static healthTimeoutMs(weightsTotalBytes) {
    const weightsBytes = Number(weightsTotalBytes) || 0;
    return Math.min(
      LaunchFinalizer.HEALTH_TIMEOUT_MAX_MS,
      Math.max(
        LaunchFinalizer.HEALTH_TIMEOUT_MIN_MS,
        LaunchFinalizer.HEALTH_WARMUP_MS + Math.round(weightsBytes / (LaunchFinalizer.LOAD_BYTES_PER_SEC / 1000)),
      ),
    );
  }

  static _applyLayoutSplit(ctx, launch) {
    const split = ctx.tensorSplit;
    if (!Array.isArray(split) || split.length <= 1 || !Array.isArray(launch.args) || ctx.rpcAcquired) return;
    if (launch.args.includes('--tensor-split')) return;
    launch.args.push('--tensor-split', split.join(','));
    if (launch.plan) launch.plan.tensorSplit = split.join(',');
  }

  _weightLedgerBySplit(launch) {
    try {
      const i = Array.isArray(launch.args) ? launch.args.indexOf('--tensor-split') : -1;
      if (i >= 0 && launch.args[i + 1]) {
        this._vram.setSplit('llm', String(launch.args[i + 1]).split(',').map((x) => Number(x.trim())));
      }
    } catch (_) {}
  }
}

module.exports = LaunchFinalizer;
