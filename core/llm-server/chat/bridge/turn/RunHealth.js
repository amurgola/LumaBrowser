class RunHealth {
  static TIMING_KEYS = ['predicted_n', 'predicted_ms', 'prompt_n', 'prompt_ms'];

  constructor() {
    this.repetitionAborted = 0;
    this.offFormatCalls = 0;
    this.lengthCutCompletions = 0;
    this.missingArgCalls = 0;
    this.offFormatShapes = {};
    this.lastUsage = null;
    this.lastTimings = null;
    this.turnTotals = { predicted_n: 0, predicted_ms: 0, prompt_n: 0, prompt_ms: 0, completions: 0 };
    this._toolLoop = null;
  }

  watchToolLoop(monitor) {
    this._toolLoop = monitor;
  }

  noteOffFormat(shape) {
    this.offFormatCalls += 1;
    this.offFormatShapes[shape] = (this.offFormatShapes[shape] || 0) + 1;
  }

  noteMissingArgs() {
    this.missingArgCalls += 1;
  }

  noteCompletion(completion) {
    if (completion && completion.stopReason === 'repetition') this.repetitionAborted += 1;
    const cut = !!(completion && completion.finishReason === 'length');
    if (cut) this.lengthCutCompletions += 1;
    return cut;
  }

  onUsage(usage) {
    if (usage) this.lastUsage = usage;
  }

  onTimings(timings) {
    if (!timings) return;
    this.lastTimings = timings;
    this.turnTotals.completions += 1;
    for (const key of RunHealth.TIMING_KEYS) {
      if (Number.isFinite(timings[key])) this.turnTotals[key] += timings[key];
    }
  }

  doneFields(result) {
    return {
      finishReason: 'stop',
      usage: this.lastUsage || undefined,
      timings: this.lastTimings || undefined,
      turnTimings: this._turnTimings(),
      iterations: result ? result.iterations : 0,
      stopReason: this.repetitionAborted ? 'repetition' : null,
      offFormatCalls: this.offFormatCalls,
      offFormatShapes: { ...this.offFormatShapes },
      lengthCutCompletions: this.lengthCutCompletions,
      missingArgCalls: this.missingArgCalls,
      overflowRecoveries: (result && Number(result.overflowRecoveries || 0)) || 0,
      toolLoop: this._toolLoopReport(),
    };
  }

  _toolLoopReport() {
    if (!this._toolLoop) return undefined;
    try { return this._toolLoop.report(); } catch (_) { return undefined; }
  }

  _turnTimings() {
    const totals = this.turnTotals;
    if (totals.completions <= 0) return undefined;
    totals.predicted_per_second = totals.predicted_ms > 0 ? totals.predicted_n / (totals.predicted_ms / 1000) : null;
    return totals;
  }
}

module.exports = RunHealth;
