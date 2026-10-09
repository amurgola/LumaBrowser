const PlanFor = require('./server/PlanFor');
const LlmRuntimeCatalog = require('./runtimes/LlmRuntimeCatalog');
const ContextLadder = require('./context/ContextLadder');
const FitRows = require('./context/FitRows');
const RungEstimator = require('./context/RungEstimator');
const ContextRungBuilder = require('./context/ContextRungBuilder');
const ModelContextEntry = require('./context/ModelContextEntry');

class ContextEstimator {
  static CTX_LADDER = ContextLadder.RUNGS;

  static shared = new ContextEstimator();

  constructor({ planFor = PlanFor.shared, catalog = LlmRuntimeCatalog.shared } = {}) {
    const estimator = new RungEstimator({ planFor, catalog });
    this._entryBuilder = new ModelContextEntry({ estimator, rungBuilder: new ContextRungBuilder(estimator) });
  }

  static ctxLabel(tokens) {
    return ContextLadder.label(tokens);
  }

  static measuredComboVram(fitEntry, tokens, kv) {
    return FitRows.measuredComboVram(fitEntry, tokens, kv);
  }

  buildLocalModelOptions({ models, fitResults, runtime, resolveRuntime, diagnostics, displayNameFor } = {}) {
    const fit = fitResults || {};
    const entries = (models || [])
      .filter((model) => ModelContextEntry.isChattable(model))
      .map((model) => this._entryBuilder.build({
        model,
        runtime: ContextEstimator._runtimeFor(model, runtime, resolveRuntime),
        diagnostics,
        fitEntry: fit[model.weights[0].path] || null,
        displayNameFor,
      }));
    return ContextEstimator._sortFitFirst(entries);
  }

  static _runtimeFor(model, runtime, resolveRuntime) {
    if (!resolveRuntime) return runtime;
    try { return resolveRuntime(model) || null; } catch (_) { return null; }
  }

  static _sortFitFirst(entries) {
    return entries.sort((a, b) => {
      if (a.hasFit !== b.hasFit) return a.hasFit ? -1 : 1;
      if (a.hasFit) return String(b.ranAt || '').localeCompare(String(a.ranAt || ''));
      return 0;
    });
  }
}

module.exports = ContextEstimator;
