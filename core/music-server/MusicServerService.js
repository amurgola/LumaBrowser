const VramCoordinator = require('../shared/runtime/VramCoordinator');
const HotswapCoordinator = require('../shared/runtime/HotswapCoordinator');
const CudaDeviceProbe = require('../shared/runtime/CudaDeviceProbe');
const MusicModelCatalog = require('./models/MusicModelCatalog');
const MusicRuntimeServer = require('./server/MusicRuntimeServer');
const MusicLaunchPlanner = require('./server/MusicLaunchPlanner');
const MusicServerSettings = require('./service/MusicServerSettings');
const MusicModelStore = require('./service/MusicModelStore');
const MusicRuntimes = require('./service/MusicRuntimes');

class MusicServerService {
  static SERVER_ID = 'music';
  static SUPPORTED_PLATFORMS = ['linux', 'win32'];
  static NOT_INSTALLED_MESSAGE = 'SGLang-Omni is not installed. Install it in Music Setup.';

  constructor({
    settingsDb,
    getDiagnostics,
    server = new MusicRuntimeServer(),
    catalog = new MusicModelCatalog(),
    vramCoordinator = VramCoordinator.shared,
    hotswap = HotswapCoordinator.shared,
    planner = new MusicLaunchPlanner({ vramCoordinator }),
    findFreePort = () => MusicRuntimeServer.findFreePort(),
    liveMemory = (diagnostics) => CudaDeviceProbe.withLiveMemory(diagnostics),
    platform = process.platform,
    settingsOptions = {},
    runtimeOptions = {},
    storeOptions = {},
  } = {}) {
    if (!settingsDb) throw new Error('MusicServerService: settingsDb is required');
    this.settingsDb = settingsDb;
    this.server = server;
    this._getDiagnostics = typeof getDiagnostics === 'function' ? getDiagnostics : async () => ({ cuda: null, gpu: null });
    this._catalog = catalog;
    this._vram = vramCoordinator;
    this._hotswap = hotswap;
    this._planner = planner;
    this._findFreePort = findFreePort;
    this._liveMemory = liveMemory;
    this._platform = platform;
    this._settings = new MusicServerSettings(settingsDb, settingsOptions);
    this._runtimes = this._createRuntimes(runtimeOptions);
    this._models = new MusicModelStore({ modelsDir: () => this.getModelsDirConfig().effectivePath, catalog, ...storeOptions });
    this._wireServer();
  }

  isPlatformSupported() { return MusicServerService.SUPPORTED_PLATFORMS.includes(this._platform); }
  isEnabled() { return this._settings.isEnabled(); }
  setEnabled(value) { this._settings.setEnabled(value); }
  getDefaults() { return this._settings.getDefaults(); }
  getExtraServeArgs() { return this._settings.getExtraServeArgs(); }
  getRuntimesDir() { return this._settings.getRuntimesDir(); }
  getModelsDirConfig() { return this._settings.getModelsDirConfig(); }

  setDefaults(patch) {
    const defaults = this._settings.setDefaults(patch);
    this.server.setIdleTimeout(defaults.autoUnloadMs);
    return defaults;
  }

  getAutoUnloadMs() { return this.getDefaults().autoUnloadMs; }

  setAutoUnloadMs(ms) {
    const value = Math.max(0, Math.floor(Number(ms) || 0));
    this.setDefaults({ autoUnloadMs: value });
    return value;
  }

  ensureRuntimesView({ force = false } = {}) { return this._runtimes.ensureView({ force }); }
  invalidateRuntimesCache() { this._runtimes.invalidateCache(); }
  getManualRuntimeBinary(id) { return this._runtimes.getManualBinary(id); }
  setManualRuntimeBinary(id, binaryPath) { this._runtimes.setManualBinary(id, binaryPath); }
  installRuntime(id, { onEvent } = {}) { return this._runtimes.install(id, { onEvent }); }
  cancelInstall() { this._runtimes.cancelInstall(); }
  checkRuntimeUpdates({ force = false } = {}) { return this._runtimes.checkUpdates({ force }); }

  async uninstallRuntime(id) {
    if (this.server.getStatus().state !== 'idle') await this.server.stop().catch(() => {});
    return this._runtimes.uninstall(id);
  }

  getModelsView() { return this._models.view(); }
  downloadModel(modelId, { onEvent } = {}) { return this._models.download(modelId, { onEvent }); }
  cancelDownload() { return this._models.cancelDownload(); }
  deleteModel(modelId) { return this._models.delete(modelId); }

  getStatus() { return this.server.getStatus(); }

  async startServerResolved(modelId) {
    try {
      const resolved = await this._resolveStart(modelId);
      if (resolved.error) return { success: false, error: resolved.error };
      await this._launch(resolved);
      return { success: true, status: this.server.getStatus() };
    } catch (err) {
      this._vram.release(MusicServerService.SERVER_ID);
      return { success: false, error: (err && err.message) || String(err) };
    }
  }

  async stopServer() {
    const status = await this.server.stop();
    return { success: true, status };
  }

  async shutdown() {
    try { this.cancelDownload(); } catch (_) {}
    this.cancelInstall();
    try { await this.server.stop(); } catch (_) {}
    if (this._releaseVram) this._releaseVram();
  }

  _createRuntimes(runtimeOptions) {
    return new MusicRuntimes({
      settingsDb: this.settingsDb,
      runtimesDir: () => this.getRuntimesDir(),
      getDiagnostics: () => this._getDiagnostics(),
      ...runtimeOptions,
    });
  }

  _wireServer() {
    this.server.setIdleTimeout(this.getAutoUnloadMs());
    this._releaseVram = this._vram.releaseOnIdle(this.server, MusicServerService.SERVER_ID);
    this._markResident = this._vram.markResidentOnReady(this.server, MusicServerService.SERVER_ID);
  }

  async _resolveStart(modelId) {
    const model = this._catalog.getById(modelId);
    if (!model) return { error: `Unknown music model: ${modelId}` };
    if (!(await this._models.isInstalled(modelId))) {
      return { error: `Music model "${modelId}" is not downloaded. Download it in Music Setup.` };
    }
    const runtimeRow = await this._compatibleRuntime(model);
    if (!runtimeRow) return { error: MusicServerService.NOT_INSTALLED_MESSAGE };
    return { model, runtimeRow };
  }

  async _compatibleRuntime(model) {
    const view = await this.ensureRuntimesView();
    const compatible = model.compatibleRuntimes || [];
    return (view.runtimes || []).find((row) => row.installed && compatible.includes(row.id)) || null;
  }

  async _launch({ model, runtimeRow }) {
    await this._evictPoolSibling();
    const launch = this._planner.plan({
      runtimeRow,
      model,
      modelPath: this._models.modelPath(model.id),
      port: await this._findFreePort(),
      extraServeArgs: this.getExtraServeArgs(),
      settingsDb: this.settingsDb,
      diagnostics: await this._liveDiagnostics(),
    });
    await this.server.start(launch);
    this.server.setIdleTimeout(this.getAutoUnloadMs());
  }

  async _evictPoolSibling() {
    try {
      await this._hotswap.acquire(MusicServerService.SERVER_ID);
    } catch (_) {}
  }

  async _liveDiagnostics() {
    const cached = await Promise.resolve().then(() => this._getDiagnostics()).catch(() => null);
    return this._liveMemory(cached);
  }
}

module.exports = MusicServerService;
