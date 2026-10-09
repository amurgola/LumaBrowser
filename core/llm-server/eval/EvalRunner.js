const Scorer = require('./Scorer');
const Aggregator = require('./Aggregator');

class EvalRunner {
  static async runEval(options) {
    return new EvalRunner(options).run();
  }

  static diffFromRuns(runResult, { baselineVariantId, candidateVariantId, modelRef = null }) {
    const pick = (variantId) => runResult.runs.find((r) => r.variantId === variantId && r.modelRef === modelRef);
    const baseline = pick(baselineVariantId);
    const candidate = pick(candidateVariantId);
    if (!baseline || !candidate) return null;
    return Aggregator.diffVariants(
      { variantId: baseline.variantId, results: baseline.results },
      { variantId: candidate.variantId, results: candidate.results },
    );
  }

  constructor({ tasks, variants, agentRun, models = [null], onProgress } = {}) {
    if (typeof agentRun !== 'function') throw new Error('runEval: agentRun function is required');
    this._tasks = tasks;
    this._variants = variants;
    this._agentRun = agentRun;
    this._models = models;
    this._onProgress = onProgress;
    this._total = tasks.length * variants.length * models.length;
    this._done = 0;
  }

  async run() {
    const runs = [];
    for (const modelRef of this._models) {
      for (const variant of this._variants) runs.push(await this._runVariant(variant, modelRef));
    }
    return { runs };
  }

  async _runVariant(variant, modelRef) {
    const results = [];
    for (const task of this._tasks) {
      const scored = Scorer.scoreTask(task, await this._transcriptFor(task, variant, modelRef));
      results.push(scored);
      this._reportProgress(task, variant, modelRef, scored);
    }
    return {
      variantId: variant.id,
      modelRef,
      label: variant.label || variant.id,
      results,
      aggregate: Aggregator.aggregate(results),
    };
  }

  async _transcriptFor(task, variant, modelRef) {
    try {
      return (await this._agentRun({ task, variant, modelRef })) || {};
    } catch (err) {
      const error = err && err.message ? err.message : String(err);
      return { error, toolCalls: [], finalResponse: '', iterations: 0 };
    }
  }

  _reportProgress(task, variant, modelRef, scored) {
    this._done += 1;
    if (!this._onProgress) return;
    try {
      this._onProgress({ done: this._done, total: this._total, taskId: task.id, variantId: variant.id, modelRef, score: scored.score });
    } catch (_) {}
  }
}

module.exports = EvalRunner;
