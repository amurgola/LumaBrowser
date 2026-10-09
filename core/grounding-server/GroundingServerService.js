const VramCoordinator = require('../shared/runtime/VramCoordinator');
const HotswapCoordinator = require('../shared/runtime/HotswapCoordinator');
const GroundingRuntimeServer = require('./GroundingRuntimeServer');
const GroundingModelFiles = require('./GroundingModelFiles');
const GroundingSettings = require('./GroundingSettings');
const GroundingLaunch = require('./GroundingLaunch');
const GroundingRecommendedModels = require('./GroundingRecommendedModels');

class GroundingServerService {
  static PROVIDER_ID = 'core.groundingServer';
  static SERVER_ID = 'grounding';
  static ROLE = 'grounding';
  static PROVIDER_NAME = 'Grounding server (managed)';
  static NOT_CONFIGURED_MESSAGE = 'No grounding model is set up. Choose or download one in the LLM tab (Visual grounding).';
  static NO_PROJECTOR_MESSAGE = 'No vision projector (mmproj) next to this model. A grounding model needs one.';

  constructor({
    settingsDb,
    llmServerService,
    createModelDownload = GroundingServerService._defaultModelDownload,
    runtimeServer = new GroundingRuntimeServer(),
    vramCoordinator = VramCoordinator.shared,
    hotswap = HotswapCoordinator.shared,
    findFreePort = () => GroundingRuntimeServer.findFreePort(),
  }) {
    this.settingsDb = settingsDb;
    this.llmServerService = llmServerService;
    this.runtimeServer = runtimeServer;
    this.lastError = null;
    this._settings = new GroundingSettings(settingsDb);
    this._vram = vramCoordinator;
    this._hotswap = hotswap;
    this._findFreePort = findFreePort;
    this._recommended = new GroundingRecommendedModels({
      getModelsRoot: () => this.llmServerService.getModelsDirConfig().effectivePath,
      createModelDownload,
    });
    this._ensureChain = Promise.resolve();
    this._wireRuntimeServer();
  }

  getModelPath() { return this._settings.getModelPath(); }
  getMmprojPath() { return this._settings.getMmprojPath(); }
  getAutoUnloadMs() { return this._settings.getAutoUnloadMs(); }
  isConfigured() { return this._settings.isConfigured(); }

  setAutoUnloadMs(ms) {
    this.runtimeServer.setIdleTimeout(this._settings.setAutoUnloadMs(ms));
  }

  async setModel({ modelPath, mmprojPath = null } = {}) {
    if (!modelPath) return this._clearModel();
    const refusal = GroundingServerService._selectionRefusal(modelPath, mmprojPath);
    if (refusal) return { success: false, error: refusal };
    const changed = modelPath !== this.getModelPath();
    this._settings.select(modelPath, mmprojPath);
    if (changed) await this.stop();
    return { success: true };
  }

  modelFileBytes() {
    if (!this.isConfigured()) return 0;
    return GroundingModelFiles.sizeOf(this.getModelPath()) + GroundingModelFiles.sizeOf(this.getMmprojPath());
  }

  estimateVramBytes() {
    const files = this.modelFileBytes();
    return files ? files + GroundingLaunch.OVERHEAD_BYTES : 0;
  }

  modelFiles() {
    return this.isConfigured() ? [this.getModelPath(), this.getMmprojPath()] : [];
  }

  ensureRunning() {
    const run = this._ensureChain.then(() => this._ensureRunningNow());
    this._ensureChain = run.catch(() => {});
    return run;
  }

  async stop() {
    try { await this.runtimeServer.stop(); } catch (_) {}
    this._vram.release(GroundingServerService.SERVER_ID);
  }

  shutdown() { return this.stop(); }

  getStatus() {
    return this.runtimeServer.getStatus();
  }

  getView() {
    const status = this.runtimeServer.getStatus();
    const modelPath = this.getModelPath();
    return {
      configured: this.isConfigured(),
      modelPath: modelPath || null,
      mmprojPath: this.getMmprojPath(),
      modelName: modelPath ? GroundingModelFiles.modelName(modelPath) : null,
      autoUnloadMs: this.getAutoUnloadMs(),
      state: status.state,
      port: status.port || null,
      lastError: this.lastError || status.lastError || null,
      recommended: this._recommended.view(),
      download: this._recommended.downloadState(),
    };
  }

  computeProviderEntry() {
    if (!this.isConfigured()) return null;
    const status = this.runtimeServer.getStatus();
    const name = GroundingModelFiles.modelName(this.getModelPath());
    return {
      id: GroundingServerService.PROVIDER_ID,
      type: 'openai',
      name: GroundingServerService.PROVIDER_NAME,
      endpoint: status.port ? `http://127.0.0.1:${status.port}` : 'http://127.0.0.1:0',
      apiKey: null,
      selectedModel: name,
      models: [{ id: name, name }],
      managedByCore: true,
    };
  }

  downloadRecommended(id, onEvent = () => {}) {
    return this._recommended.download(id, onEvent, (selection) => this.setModel(selection));
  }

  cancelDownload() {
    this._recommended.cancel();
    return { success: true };
  }

  _wireRuntimeServer() {
    this.runtimeServer.setIdleTimeout(this.getAutoUnloadMs());
    this._releaseVram = this._vram.releaseOnIdle(this.runtimeServer, GroundingServerService.SERVER_ID);
    this._markResident = this._vram.markResidentOnReady(this.runtimeServer, GroundingServerService.SERVER_ID);
  }

  async _clearModel() {
    this._settings.clear();
    await this.stop();
    return { success: true };
  }

  static _selectionRefusal(modelPath, mmprojPath) {
    if (!GroundingModelFiles.exists(modelPath)) return `Model not found: ${modelPath}`;
    const projector = mmprojPath || GroundingModelFiles.pairMmproj(modelPath);
    if (!GroundingModelFiles.exists(projector)) return GroundingServerService.NO_PROJECTOR_MESSAGE;
    return null;
  }

  async _ensureRunningNow() {
    if (!this.isConfigured()) {
      return { success: false, code: 'NOT_CONFIGURED', error: GroundingServerService.NOT_CONFIGURED_MESSAGE };
    }
    const reused = this._reuseReadyServer();
    if (reused) return reused;
    await this._stopUnsettledServer();
    return this._startServer();
  }

  _reuseReadyServer() {
    const status = this.runtimeServer.getStatus();
    if (status.state !== 'ready' || !status.plan || status.plan.modelPath !== this.getModelPath()) return null;
    this.runtimeServer.markActive();
    return { success: true, status };
  }

  async _stopUnsettledServer() {
    const { state } = this.runtimeServer.getStatus();
    if (state !== 'idle' && state !== 'error') await this.runtimeServer.stop().catch(() => {});
  }

  async _startServer() {
    const modelPath = this.getModelPath();
    const mmprojPath = this.getMmprojPath();
    try {
      const runtime = await GroundingLaunch.pickRuntime(this.llmServerService);
      const reservation = await this._reserveCard(modelPath, mmprojPath);
      const port = await this._findFreePort();
      const startedAt = Date.now();
      await this.runtimeServer.start(GroundingServerService._launch({ runtime, reservation, port, modelPath, mmprojPath }));
      this.runtimeServer.setIdleTimeout(this.getAutoUnloadMs());
      GroundingServerService._logReady(port, runtime, reservation, Date.now() - startedAt);
      this.lastError = null;
      return { success: true, status: this.runtimeServer.getStatus() };
    } catch (e) {
      this._vram.release(GroundingServerService.SERVER_ID);
      this.lastError = e.message;
      return { success: false, error: `Grounding server failed to start: ${e.message}` };
    }
  }

  async _reserveCard(modelPath, mmprojPath) {
    try {
      await this._hotswap.acquire(GroundingServerService.SERVER_ID);
    } catch (_) {}
    return this._vram.reserve({
      serverId: GroundingServerService.SERVER_ID,
      role: GroundingServerService.ROLE,
      requiredBytes: GroundingLaunch.requiredBytes(modelPath, mmprojPath),
      allowSplit: false,
      settingsDb: this.settingsDb,
    });
  }

  static _launch({ runtime, reservation, port, modelPath, mmprojPath }) {
    return {
      binaryPath: runtime.binaryPath,
      args: GroundingLaunch.buildArgs({ modelPath, mmprojPath, port, offloadToCpu: reservation.offloadToCpu }),
      plan: GroundingLaunch.plan({ port, modelPath, mmprojPath, runtimeId: runtime.id }),
      healthTimeoutMs: GroundingLaunch.HEALTH_TIMEOUT_MS,
      cudaDevice: reservation.cudaDevice || undefined,
    };
  }

  static _logReady(port, runtime, reservation, elapsedMs) {
    const pin = reservation.cudaDevice ? ` (CUDA ${reservation.cudaDevice})` : '';
    console.log(`[grounding-server] ready on :${port} via ${runtime.id} in ${elapsedMs} ms${pin}`);
  }

  static _defaultModelDownload(options) {
    return require('../llm-server/models/ModelDownload').start(options);
  }
}

module.exports = GroundingServerService;
