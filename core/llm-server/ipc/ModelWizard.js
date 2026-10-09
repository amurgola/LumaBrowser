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
    const diag = await this._gather({ savedNvidiaSmiPath: this._svc.getSavedNvidiaSmiPath() });
    if (diagOut) diagOut.diag = diag;
    return HwBudget.build(diag, { cudaRuntimePreference: (cudaVersion) => this._catalog.cudaRuntimePreference(cudaVersion) });
  }

  async recommend(answers) {
    const hardware = await this.hardware();
    return { hardware, recommendation: Recommender.recommend(hardware, answers || {}) };
  }
}

module.exports = ModelWizard;
