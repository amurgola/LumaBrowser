class LocalRestartDecision {
  static decide({ switched, defaults, status, dirty, imageCount }) {
    const ready = status.state === 'ready';
    const desiredCtx = Number(defaults.contextSize) || null;
    const runningCtx = LocalRestartDecision._runningRequestedCtx(status.plan);
    const ctxChanged = !switched && ready && desiredCtx != null && runningCtx != null && runningCtx !== desiredCtx;
    const wantVision = LocalRestartDecision._wantsVision(status.plan, imageCount);
    const haveVision = !!(status.plan && status.plan.mmprojPath);
    const visionLoad = !switched && !ctxChanged && ready && wantVision && !haveVision;
    const reason = LocalRestartDecision._reason({ switched, ctxChanged, visionLoad, dirty, ready });
    return { reason, wantVision, haveVision, desiredCtx, runningCtx };
  }

  static _reason({ switched, ctxChanged, visionLoad, dirty, ready }) {
    if (switched) return 'switching-model';
    if (ctxChanged) return 'switching-context';
    if (visionLoad) return 'loading-vision';
    if (dirty) return 'recovering-cancelled';
    return ready ? null : 'starting-server';
  }

  static _runningRequestedCtx(plan) {
    return (plan && Number(plan.requestedContextSize || plan.contextSize)) || null;
  }

  static _wantsVision(plan, imageCount) {
    if (!(imageCount > 0)) return false;
    return plan ? !!plan.mmprojAvailable : true;
  }
}

module.exports = LocalRestartDecision;
