class LocalRestartDecision {
  static decide({ switched, defaults, status, dirty, imageCount, drafterKey }) {
    const ready = status.state === 'ready';
    const desiredCtx = Number(defaults.contextSize) || null;
    const runningCtx = LocalRestartDecision._runningRequestedCtx(status.plan);
    const ctxChanged = !switched && ready && desiredCtx != null && runningCtx != null && runningCtx !== desiredCtx;
    const wantVision = LocalRestartDecision._wantsVision(status.plan, imageCount);
    const haveVision = !!(status.plan && status.plan.mmprojPath);
    const drafterChanged = !switched && !ctxChanged && ready && LocalRestartDecision._drafterChanged(status.plan, drafterKey);
    const visionLoad = !switched && !ctxChanged && !drafterChanged && ready && wantVision && !haveVision;
    const reason = LocalRestartDecision._reason({ switched, ctxChanged, drafterChanged, visionLoad, dirty, ready });
    return { reason, wantVision, haveVision, desiredCtx, runningCtx };
  }

  static _reason({ switched, ctxChanged, drafterChanged, visionLoad, dirty, ready }) {
    if (switched) return 'switching-model';
    if (ctxChanged) return 'switching-context';
    if (drafterChanged) return 'switching-drafter';
    if (visionLoad) return 'loading-vision';
    if (dirty) return 'recovering-cancelled';
    return ready ? null : 'starting-server';
  }

  static _runningRequestedCtx(plan) {
    return (plan && Number(plan.requestedContextSize || plan.contextSize)) || null;
  }

  static _drafterChanged(plan, drafterKey) {
    const running = plan && plan.drafterChoiceKey;
    return typeof running === 'string' && typeof drafterKey === 'string' && running !== drafterKey;
  }

  static _wantsVision(plan, imageCount) {
    if (!(imageCount > 0)) return false;
    return plan ? !!plan.mmprojAvailable : true;
  }
}

module.exports = LocalRestartDecision;
