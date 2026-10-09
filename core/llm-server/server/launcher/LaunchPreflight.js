const UnsupportedFlagMemory = require('../UnsupportedFlagMemory');
const ModelRuntimeMatch = require('./ModelRuntimeMatch');

class LaunchPreflight {
  constructor({ diagnostics, detector, scanner, catalog }) {
    this._diagnostics = diagnostics;
    this._detector = detector;
    this._scanner = scanner;
    this._catalog = catalog;
  }

  async resolve(ctx, timings) {
    ctx.diag = await this._readDiagnostics(ctx.service);
    timings.diag = Date.now();
    const runtimeRefusal = await this._resolveRuntime(ctx);
    if (runtimeRefusal) return runtimeRefusal;
    timings.runtimes = Date.now();
    const modelRefusal = await this._resolveModel(ctx, timings);
    if (modelRefusal) return modelRefusal;
    return this._resolveApiKey(ctx);
  }

  async _readDiagnostics(service) {
    if (typeof service.ensureDiagnostics === 'function') return service.ensureDiagnostics();
    return this._diagnostics.gather({ savedNvidiaSmiPath: service.getSavedNvidiaSmiPath() });
  }

  async _readRuntimesView(service, diag) {
    if (typeof service.ensureRuntimesView === 'function') return service.ensureRuntimesView();
    return this._detector.detectRuntimes({
      runtimesRoot: service.getRuntimesDir(),
      cuda: diag.cuda,
      gpu: diag.gpu,
      manualBinaries: service.getAllManualRuntimeBinaries(),
    });
  }

  async _resolveRuntime(ctx) {
    const view = await this._readRuntimesView(ctx.service, ctx.diag);
    const row = view.runtimes.find((r) => r.id === ctx.defaults.runtimeId);
    if (!row) return { success: false, error: `Runtime ${ctx.defaults.runtimeId} not found in detector view.` };
    if (!row.installed) return this._notInstalledRefusal(row);
    if (!row.binaryPath) return { success: false, error: `Runtime ${row.name} has no usable binary.` };
    ctx.runtimeRow = row;
    ctx.runtime = UnsupportedFlagMemory.withLearnedFlags(row, ctx.settingsDb);
    return null;
  }

  _notInstalledRefusal(row) {
    return {
      success: false,
      error: `Runtime ${row.name} is not installed.`,
      code: 'RUNTIME_NOT_INSTALLED',
      runtimeId: row.id,
      runtimeName: row.name,
      installable: this._isInstallable(row),
    };
  }

  _isInstallable(row) {
    if (row.installable != null) return !!row.installable;
    const entry = this._catalog.getById(row.id);
    return !!(entry && entry.kind === 'inference'
      && entry.acquisition !== 'manual-source' && this._catalog.getAssetPattern(entry));
  }

  async _resolveModel(ctx, timings) {
    const modelsConfig = ctx.service.getModelsDirConfig();
    const view = await this._scanner.scan(modelsConfig.effectivePath);
    timings.scan = Date.now();
    const model = (view.models || []).find((m) => m.weights && m.weights[0] && m.weights[0].path === ctx.defaults.modelPath);
    if (!model) return { success: false, error: 'Default model path no longer matches a scanned model.' };
    ctx.model = model;
    return ModelRuntimeMatch.refusal(model, ctx.runtime);
  }

  _resolveApiKey(ctx) {
    const info = ctx.service.getApiKeyForLaunch
      ? ctx.service.getApiKeyForLaunch()
      : { required: false, key: null, keyCount: 0 };
    if (info.required && !info.key) {
      return {
        success: false,
        error: 'API security is enabled but no keys exist. Create one in Settings → API Security before starting the LLM server.',
      };
    }
    ctx.launchKey = info.required ? info.key : null;
    return null;
  }
}

module.exports = LaunchPreflight;
