const SystemDiagnostics = require('../SystemDiagnostics');
const LlmRuntimeCatalog = require('../runtimes/LlmRuntimeCatalog');
const HwBudget = require('../models/HwBudget');
const Recommender = require('../models/Recommender');

class ModelWizard {
  constructor({ llmServerService, gather = SystemDiagnostics.gather, catalog = LlmRuntimeCatalog.shared }) {
    this._svc = llmServerService;
    this._gather = gather;
    this._catalog = catalog;
  }

  async hardware(diagOut) {
    const diag = await this._diagnostics();
    if (diagOut) diagOut.diag = diag;
    return HwBudget.build(diag, { cudaRuntimePreference: (cudaVersion) => this._catalog.cudaRuntimePreference(cudaVersion) });
  }

  async _diagnostics() {
    if (typeof this._svc.ensureDiagnostics === 'function') {
      try {
        const cached = await this._svc.ensureDiagnostics();
        if (cached && typeof cached === 'object') return cached;
      } catch (_) {}
    }
    return this._gather({ savedNvidiaSmiPath: this._svc.getSavedNvidiaSmiPath() });
  }

  async recommend(answers) {
    const hardware = await this.hardware();
    return { hardware, recommendation: Recommender.recommend(hardware, answers || {}) };
  }
}

module.exports = ModelWizard;
