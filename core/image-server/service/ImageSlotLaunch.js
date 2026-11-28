const fs = require('fs');
const path = require('path');
const CudaPin = require('../../shared/runtime/CudaPin');
const ClipPlacement = require('../server/ClipPlacement');
const ChatSwapOut = require('./ChatSwapOut');
const ImageLaunchPlanner = require('../server/ImageLaunchPlanner');
const ImageSlotRoles = require('./ImageSlotRoles');
const ImageSlotPlacement = require('./ImageSlotPlacement');
const ImageLaunchInputs = require('./ImageLaunchInputs');
const ImageLaunchLog = require('./ImageLaunchLog');
const MeasuredFootprintStore = require('../../placement/service/MeasuredFootprintStore');
const PreferredImageRuntime = require('./PreferredImageRuntime');
const SageAttentionPolicy = require('./SageAttentionPolicy');
const VaeTilingPolicy = require('./VaeTilingPolicy');

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
      || ImageLaunchInputs.apiKeyRefusal(this._service.getApiKeyForLaunch())
      || this._preferRuntime();
    if (refusal) return { success: false, error: refusal };
    await this._allocatePorts();
    await this._evictSwapSibling();
    await this._placeOnGpus();
    if (await this._swapOutCrowdingChat()) await this._placeOnGpus();
    const launch = await this._planLaunch();
    this._logLaunch(launch.plan);
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
    this._runtimes = found.runtimes || [];
    return found.error || null;
  }

  async _resolveModel() {
    const found = await this._deps.inputs.model({ modelId: this._modelId, modelsDir: this._modelsDir });
    this._model = found.model;
    this._profile = found.model ? ImageSlotRoles.profile(this._role, found.model) : null;
    return found.error || null;
  }

  _preferRuntime() {
    const picked = PreferredImageRuntime.pick({ model: this._model, configured: this._runtime, runtimes: this._runtimes });
    this._runtime = picked.runtime;
    this._runtimeNote = picked.note;
    return picked.error;
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
    this._requiredBytes = ImageSlotPlacement.requiredBytes(this._model, this._role, this._measuredPeakBytes());
    this._cpuOnly = ImageSlotPlacement.isCpuOnlyRuntime(this._runtime);
    this._placement = await this._deps.placement.place({
      role: this._role,
      runtime: this._runtime,
      requiredBytes: this._requiredBytes,
      settingsDb: this._service.settingsDb,
      diagnostics: this._diag,
    });
  }

  async _swapOutCrowdingChat() {
    if (this._cpuOnly) return false;
    const card = ChatSwapOut.cardToFree({
      placement: this._placement,
      role: this._role,
      settingsDb: this._service.settingsDb,
      claims: this._ledgerClaims(),
      cards: this._otherClaimsDebited(),
      requiredBytes: this._requiredBytes,
    });
    if (card == null || typeof this._deps.hotswap.swapOut !== 'function') return false;
    if ((await this._deps.hotswap.swapOut(this._role, [ChatSwapOut.CHAT_SERVER_ID], card)) == null) return false;
    this._deps.log(`[image-server] ${this._role}: the chat model left GPU ${card} so ${this._modelId} can load; it returns on the next chat turn.`);
    try { this._diag = this._deps.liveMemory(this._diag); } catch (_) {}
    return true;
  }

  _measuredPeakBytes() {
    try { return new MeasuredFootprintStore(this._service.settingsDb).peakVramBytes(this._modelId); } catch (_) { return 0; }
  }

  _ledgerClaims() {
    try { return this._deps.vramCoordinator.snapshot(); } catch (_) { return null; }
  }

  _otherClaimsDebited() {
    try { return this._deps.vramCoordinator.debitedDevices(this._diag, { excludeServerId: this._role }); } catch (_) { return null; }
  }

  async _planLaunch() {
    const { cudaDevice, offloadToCpu, autoFit } = this._placement;
    this._vaeTiling = VaeTilingPolicy.decide({ model: this._model, profile: this._profile, offloadToCpu, cudaDevice, diagnostics: this._diag });
    this._clip = this._decideTextEncoders();
    this._int8Weights = this._decideInt8Weights();
    this._sage = await this._decideSageAttention(cudaDevice);
    const [eagerLoad, tileSize] = await Promise.all([
      this._supportsFlag(ImageLaunchPlanner.EAGER_LOAD_FLAG),
      this._vaeTiling ? this._supportsFlag(ImageLaunchPlanner.VAE_TILE_SIZE_FLAG) : false,
    ]);
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
        hotswapPooled: this._isHotswapPooled(),
        clipOnCpu: this._clip.clipOnCpu,
        sageAttention: this._sage.sageAttention,
        int8Weights: this._int8Weights,
        eagerLoad,
        vaeTileSize: tileSize ? VaeTilingPolicy.TILE_SIZE : null,
        autoFitForm: autoFit ? await this._deps.capabilities.autoFitFlagForm(this._runtime.binaryPath) : undefined,
      },
    });
    launch.cudaDevice = cudaDevice;
    return launch;
  }

  _isHotswapPooled() {
    if (this._cpuOnly || typeof this._deps.hotswap.isPooled !== 'function') return false;
    try { return this._deps.hotswap.isPooled(this._role); } catch (_) { return false; }
  }

  _supportsFlag(flag) {
    return this._deps.capabilities.supportsFlag(this._runtime.binaryPath, flag);
  }

  _decideInt8Weights() {
    const diffusion = this._model.files && this._model.files.diffusion;
    return !!(diffusion && diffusion.int8Path) && SageAttentionPolicy.isCudaRuntime(this._runtime);
  }

  _decideSageAttention(cudaDevice) {
    if (this._cpuOnly) return { sageAttention: false, note: null };
    return SageAttentionPolicy.decide({
      model: this._model,
      runtime: this._runtime,
      cudaDevice,
      diagnostics: this._diag,
      supportsFlag: (flag) => this._deps.capabilities.supportsFlag(this._runtime.binaryPath, flag),
      int8Weights: this._int8Weights,
    });
  }

  _decideTextEncoders() {
    const { cudaDevice, offloadToCpu, autoFit } = this._placement;
    return ClipPlacement.decide({ model: this._model, cudaDevice, offloadToCpu, autoFit: !!autoFit, cpuOnly: this._cpuOnly });
  }

  _logLaunch(plan) {
    this._deps.log(ImageLaunchLog.line({
      role: this._role,
      modelId: this._modelId,
      placement: { ...this._placement, offloadToCpu: !!(plan && plan.offloadToCpu) },
      profile: this._profile,
      vaeTiling: this._vaeTiling,
      cpuOnly: this._cpuOnly,
      clipNote: this._clip.note,
      runtimeNote: this._runtimeNote,
      int8Weights: this._int8Weights,
      sageNote: this._sage.note,
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
