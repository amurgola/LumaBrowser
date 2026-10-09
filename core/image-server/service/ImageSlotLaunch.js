const fs = require('fs');
const path = require('path');
const CudaPin = require('../../shared/runtime/CudaPin');
const ClipPlacement = require('../server/ClipPlacement');
const ImageSlotRoles = require('./ImageSlotRoles');
const ImageSlotPlacement = require('./ImageSlotPlacement');
const ImageLaunchInputs = require('./ImageLaunchInputs');
const ImageLaunchLog = require('./ImageLaunchLog');
const VaeTilingPolicy = require('./VaeTilingPolicy');
const UserGpuPin = require('./UserGpuPin');

class ImageSlotLaunch {
  static LORA_DIR = 'loras';

  constructor(service, deps) {
    this._service = service;
    this._deps = deps;
  }

  async run(modelIdOverride, opts = {}) {
    this._setupFromRequest(modelIdOverride, opts);
    const refusal = ImageLaunchInputs.defaultsRefusal(this._defaults.runtimeId, this._modelId)
      || await this._resolveRuntime()
      || await this._resolveModel()
      || ImageLaunchInputs.apiKeyRefusal(this._service.getApiKeyForLaunch());
    if (refusal) return { success: false, error: refusal };
    await this._allocatePorts();
    await this._evictSwapSibling();
    await this._placeOnGpus();
    const launch = await this._planLaunch();
    this._logLaunch();
    await this._server.start(launch);
    return { success: true, status: this._server.getStatus(), plan: launch.plan };
  }

  _setupFromRequest(modelIdOverride, opts) {
    this._role = ImageSlotRoles.normalize(opts.role);
    this._server = this._service.serverForRole(this._role);
    this._defaults = this._service.getDefaults();
    this._modelId = modelIdOverride || this._defaults[ImageSlotRoles.defaultKey(this._role)];
    this._modelsDir = this._service.getModelsDirConfig().effectivePath;
  }

  async _resolveRuntime() {
    this._diag = this._deps.liveMemory(await this._deps.getDiagnostics());
    const found = await this._deps.inputs.runtime({
      runtimeId: this._defaults.runtimeId,
      runtimesRoot: this._service.getRuntimesDir(),
      diagnostics: this._diag,
      manualBinaries: this._service.getAllManualRuntimeBinaries(),
    });
    this._runtime = found.runtime;
    return found.error || null;
  }

  async _resolveModel() {
    const found = await this._deps.inputs.model({ modelId: this._modelId, modelsDir: this._modelsDir });
    this._model = found.model;
    this._profile = found.model ? ImageSlotRoles.profile(this._role, found.model) : null;
    return found.error || null;
  }

  async _allocatePorts() {
    this._publicPort = await this._deps.findFreePort(this._role);
    this._privatePort = await this._deps.findFreePort(this._role, { exclude: [this._publicPort] });
  }

  async _evictSwapSibling() {
    let card = null;
    try { card = await this._deps.hotswap.acquire(this._role); } catch (_) {}
    if (card == null) return;
    try { this._diag = this._deps.liveMemory(this._diag); } catch (_) {}
  }

  async _placeOnGpus() {
    this._requiredBytes = ImageSlotPlacement.requiredBytes(this._model, this._role);
    this._cpuOnly = ImageSlotPlacement.isCpuOnlyRuntime(this._runtime);
    this._placement = await this._deps.placement.place({
      role: this._role,
      runtime: this._runtime,
      requiredBytes: this._requiredBytes,
      settingsDb: this._service.settingsDb,
      diagnostics: this._diag,
    });
  }

  async _planLaunch() {
    const { cudaDevice, offloadToCpu, autoFit } = this._placement;
    this._vaeTiling = VaeTilingPolicy.decide({ model: this._model, profile: this._profile, offloadToCpu, cudaDevice, diagnostics: this._diag });
    this._clip = this._decideTextEncoders();
    const launch = this._deps.launchPlanner.plan({
      model: this._model,
      runtime: this._runtime,
      diagnostics: CudaPin.filterDiagnosticsToDevices(this._diag, cudaDevice),
      port: this._privatePort,
      publicPort: this._publicPort,
      overrides: {
        offloadToCpu,
        vaeTiling: this._vaeTiling,
        loraDir: ImageSlotLaunch.existingLoraDir(this._modelsDir),
        autoFit,
        clipOnCpu: this._clip.clipOnCpu,
        autoFitForm: autoFit ? await this._deps.capabilities.autoFitFlagForm(this._runtime.binaryPath) : undefined,
      },
    });
    launch.cudaDevice = cudaDevice;
    return launch;
  }

  _decideTextEncoders() {
    const { cudaDevice, offloadToCpu, autoFit } = this._placement;
    return ClipPlacement.decide({
      model: this._model,
      cudaDevice,
      offloadToCpu,
      autoFit: !!autoFit,
      requiredBytes: this._requiredBytes,
      devices: this._deps.vramCoordinator.debitedDevices(this._diag, { excludeServerId: this._role }),
      userPinned: UserGpuPin.isPinnedToGpu(this._service.settingsDb, this._role),
    });
  }

  _logLaunch() {
    this._deps.log(ImageLaunchLog.line({
      role: this._role,
      modelId: this._modelId,
      placement: this._placement,
      profile: this._profile,
      vaeTiling: this._vaeTiling,
      cpuOnly: this._cpuOnly,
      clipNote: this._clip.note,
    }));
  }

  static existingLoraDir(modelsDir, { existsSync = fs.existsSync } = {}) {
    try {
      const dir = path.join(modelsDir, ImageSlotLaunch.LORA_DIR);
      return existsSync(dir) ? dir : null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = ImageSlotLaunch;
