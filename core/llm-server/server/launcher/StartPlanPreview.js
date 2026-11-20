const CudaPin = require('../../../shared/runtime/CudaPin');
const VramCoordinator = require('../../../shared/runtime/VramCoordinator');
const LlmPlacement = require('./LlmPlacement');

class StartPlanPreview {
  static PORT = 8080;

  constructor({ planFor, catalog, placement = new LlmPlacement({ vram: VramCoordinator.shared }) }) {
    this._planFor = planFor;
    this._catalog = catalog;
    this._placement = placement;
  }

  plan({ model, runtime, diagnostics, settingsDb = null, overrides }) {
    const request = {
      model,
      runtime,
      runtimeCatalogEntry: this._catalog.getById(runtime.id),
      port: StartPlanPreview.PORT,
      overrides,
    };
    const probe = this._planFor.plan({ ...request, diagnostics }).plan || {};
    if (this._planFor.isCustomLaunch(request.runtimeCatalogEntry)) return probe;
    const cudaDevice = this._placement.previewCudaDevice({ diagnostics, settingsDb, plan: probe });
    if (!cudaDevice) return probe;
    return this._planFor.plan({ ...request, diagnostics: CudaPin.filterDiagnosticsToDevices(diagnostics, cudaDevice) }).plan || {};
  }
}

module.exports = StartPlanPreview;
