class FitShape {
  static of({ flags, batch, spec, moe, kv }, decision) {
    return [
      `runtime ${flags.id}@${flags.build != null ? flags.build : 'unknown'}`,
      `window cache ${FitShape._windowCache(flags, decision)}`,
      `micro-batch ${batch.microBatch}`,
      `draft ${FitShape._draft(spec)}`,
      `experts ${FitShape._experts(moe)}`,
      `kv ${kv.kvOnHost ? 'host' : 'gpu'}`,
    ].join('; ');
  }

  static matches(measuredShape, shape) {
    return typeof measuredShape === 'string' && measuredShape.length > 0 && measuredShape === shape;
  }

  static _windowCache(flags, decision) {
    if (!decision.swaLayout) return 'none';
    return flags.swaFull && decision.swaFullAffordable ? 'full' : 'windowed';
  }

  static _draft(spec) {
    if (spec.mtpEnabled) return 'mtp';
    return spec.specDrafterBytes > 0 ? 'drafter' : 'none';
  }

  static _experts(moe) {
    if (!moe.cpuMoeEnabled) return 'gpu';
    return moe.gpuCache && moe.gpuCache.enabled ? 'cache' : 'layers';
  }
}

module.exports = FitShape;
