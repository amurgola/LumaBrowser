const LlmModelsScanner = require('../LlmModelsScanner');
const ContextEstimator = require('../ContextEstimator');
const FitRuntimePicker = require('./FitRuntimePicker');
const ModelGrouping = require('../models/ModelGrouping');

class LocalModelOptions {
  constructor({ llmServerService, scanner = LlmModelsScanner.shared, estimator = ContextEstimator.shared }) {
    this._svc = llmServerService;
    this._scanner = scanner;
    this._estimator = estimator;
  }

  async options() {
    const diag = await this._svc.ensureDiagnostics();
    const runtimesView = await this._svc.ensureRuntimesView();
    const scan = await this._scanner.scan(this._svc.getModelsDirConfig().effectivePath);
    const defaults = this._svc.getDefaults();
    const models = this._estimator.buildLocalModelOptions({
      models: scan.models || [],
      fitResults: this._svc.getAllFitResults(),
      resolveRuntime: (m) => FitRuntimePicker.pick(m, runtimesView, diag),
      diagnostics: diag,
      displayNameFor: (stem) => this._svc.resolveModelDisplayName(stem),
    });
    const overrides = typeof this._svc.getModelDisplayNames === 'function' ? this._svc.getModelDisplayNames() || {} : {};
    const byPath = new Map((scan.models || []).map((m) => [m.weights && m.weights[0] && m.weights[0].path, m]));
    for (const entry of models) {
      const source = byPath.get(entry.path) || entry;
      entry.grouping = ModelGrouping.of(source, { customName: overrides[entry.nameKey] || null });
    }
    return {
      models,
      currentModelPath: defaults.modelPath || null,
      currentContext: defaults.contextSize || null,
    };
  }
}

module.exports = LocalModelOptions;
