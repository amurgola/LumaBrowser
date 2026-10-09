class TurnMilestones {
  constructor() {
    this._toolStart = null;
    this._firstStep = null;
    this._lastStep = null;
    this._firstStepNo = null;
    this._lastStepNo = null;
    this._totalSteps = null;
  }

  markToolStart(now) {
    if (this._toolStart == null) this._toolStart = now;
  }

  markProgress(payload, now) {
    this.markToolStart(now);
    const stepNo = payload && Number(payload.step);
    if (!Number.isFinite(stepNo)) return;
    if (this._firstStep == null) { this._firstStep = now; this._firstStepNo = stepNo; }
    this._lastStep = now;
    this._lastStepNo = stepNo;
    const total = payload && Number(payload.totalSteps);
    if (Number.isFinite(total) && total > 0) this._totalSteps = total;
  }

  timing(startedAt, endedAt) {
    const diffusionMs = this._between(this._firstStep, this._lastStep);
    return {
      llmDecisionMs: this._toolStart != null ? this._toolStart - startedAt : null,
      imageLoadMs: this._between(this._toolStart, this._firstStep),
      diffusionMs,
      tailMs: this._lastStep != null ? endedAt - this._lastStep : null,
      itPerSec: this._itPerSec(diffusionMs),
      steps: this._totalSteps || this._lastStepNo || null,
    };
  }

  _between(from, to) {
    return from != null && to != null ? to - from : null;
  }

  _itPerSec(diffusionMs) {
    if (this._firstStepNo == null || this._lastStepNo == null) return null;
    if (!(diffusionMs > 0) || this._lastStepNo <= this._firstStepNo) return null;
    return (this._lastStepNo - this._firstStepNo) / (diffusionMs / 1000);
  }
}

module.exports = TurnMilestones;
