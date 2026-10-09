const LlmModelsScanner = require('../LlmModelsScanner');
const ContextEstimator = require('../ContextEstimator');
const FitRuntimePicker = require('./FitRuntimePicker');

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
    return {
      models: this._estimator.buildLocalModelOptions({
        models: scan.models || [],
        fitResults: this._svc.getAllFitResults(),
        resolveRuntime: (m) => FitRuntimePicker.pick(m, runtimesView, diag),
        diagnostics: diag,
        displayNameFor: (stem) => this._svc.resolveModelDisplayName(stem),
      }),
      currentModelPath: defaults.modelPath || null,
      currentContext: defaults.contextSize || null,
    };
  }
}

module.exports = LocalModelOptions;
