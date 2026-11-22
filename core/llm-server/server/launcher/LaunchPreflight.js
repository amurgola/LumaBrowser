const UnsupportedFlagMemory = require('../UnsupportedFlagMemory');
const ModelRuntimeMatch = require('./ModelRuntimeMatch');
const CudaDeviceProbe = require('../../../shared/runtime/CudaDeviceProbe');

class LaunchPreflight {
  static GPU_READY_MS = 3000;

  constructor({ diagnostics, detector, scanner, catalog, gpuReady = () => CudaDeviceProbe.whenReady(LaunchPreflight.GPU_READY_MS) }) {
    this._diagnostics = diagnostics;
    this._detector = detector;
    this._scanner = scanner;
    this._catalog = catalog;
    this._gpuReady = gpuReady;
  }

  async resolve(ctx, timings) {
    ctx.diag = await this._readDiagnostics(ctx.service);
    await this._gpuReady();
    timings.diag = Date.now();
    const modelRefusal = await this._resolveModel(ctx, timings);
    if (modelRefusal) return modelRefusal;
    const runtimeRefusal = await this._resolveRuntime(ctx);
    if (runtimeRefusal) return runtimeRefusal;
    timings.runtimes = Date.now();
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
    const outcome = ctx.service.runtimeChooser.forModel(ctx.model, { runtimesView: view, diagnostics: ctx.diag });
    if (outcome.runtime) return this._useRuntime(ctx, outcome.runtime);
    if (outcome.missing) return this._missingRefusal(outcome.missing);
    return LaunchPreflight._unloadableRefusal(ctx.model, outcome.unloadable);
  }

  _useRuntime(ctx, row) {
    ctx.runtimeRow = row;
    ctx.runtime = UnsupportedFlagMemory.withLearnedFlags(row, ctx.settingsDb);
    LaunchPreflight._recordRuntime(ctx, row.id);
    return null;
  }

  static _recordRuntime(ctx, runtimeId) {
    if (runtimeId === ctx.defaults.runtimeId) return;
    const service = ctx.service;
    if (typeof service.setDefaults === 'function') {
      service.setDefaults({ runtimeId });
      ctx.defaults = service.getLaunchDefaults ? service.getLaunchDefaults() : service.getDefaults();
    }
    ctx.defaults = { ...ctx.defaults, runtimeId };
  }

  _missingRefusal(row) {
    if (row.installed && !row.binaryPath) return { success: false, error: `Runtime ${row.name} has no usable binary.` };
    return this._notInstalledRefusal(row);
  }

  static _unloadableRefusal(model, format) {
    const what = format ? `${model.name} (${format} format)` : `${model.name}: a projector or draft head is not a model to load on its own`;
    return {
      success: false,
      error: `No framework on this PC loads ${what}. Pick another model in Setup → Defaults.`,
      code: ModelRuntimeMatch.CODE,
    };
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
    return null;
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
