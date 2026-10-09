const path = require('path');
const AppPaths = require('../shared/AppPaths');
const ManagedRuntimeSettings = require('../shared/runtime/ManagedRuntimeSettings');
const VramCoordinator = require('../shared/runtime/VramCoordinator');
const HotswapCoordinator = require('../shared/runtime/HotswapCoordinator');
const CudaDeviceProbe = require('../shared/runtime/CudaDeviceProbe');
const RamPinService = require('../shared/runtime/rampin/RamPinService');
const ImageRuntimeServer = require('./server/ImageRuntimeServer');
const VideoRuntimeServer = require('./server/VideoRuntimeServer');
const ImageLaunchPlanner = require('./server/ImageLaunchPlanner');
const ImageRuntimeCatalog = require('./runtimes/ImageRuntimeCatalog');
const ImageRuntimeDetector = require('./runtimes/ImageRuntimeDetector');
const ImageModelsScanner = require('./ImageModelsScanner');
const ImagePinTarget = require('./rampin/ImagePinTarget');
const ImageSlotRoles = require('./service/ImageSlotRoles');
const ImageServerSettings = require('./service/ImageServerSettings');
const ImageModelDisplayNames = require('./service/ImageModelDisplayNames');
const RemoteImageServerStore = require('./service/RemoteImageServerStore');
const ImageServerSelection = require('./service/ImageServerSelection');
const InstalledImageModels = require('./service/InstalledImageModels');
const SdServerCapabilities = require('./service/SdServerCapabilities');
const ImageSlotPlacement = require('./service/ImageSlotPlacement');
const ImageLaunchInputs = require('./service/ImageLaunchInputs');
const ImageSlotLaunch = require('./service/ImageSlotLaunch');

class ImageServerService {
  static DEFAULT_AUTO_UNLOAD_MS = ImageServerSettings.DEFAULT_AUTO_UNLOAD_MS;
  static LOCAL_GENERATE_ID = ImageServerSelection.LOCAL_GENERATE_ID;
  static LOCAL_EDIT_ID = ImageServerSelection.LOCAL_EDIT_ID;
  static RUNTIMES_CACHE_KEY = 'core.imageServer.runtimesViewCache';
  static MANUAL_BINARY_PREFIX = 'core.imageServer.runtimes.';
  static RAM_PIN_NAME = 'luma-image-ram-pin';

  constructor(settingsDb, options = {}) {
    if (!settingsDb) throw new Error('ImageServerService requires a SettingsDatabase');
    this.settingsDb = settingsDb;
    this.apiSecurity = options.apiSecurity || null;
    this._deps = ImageServerService._resolveDeps(options);
    this._createStores();
    this._createSupervisors();
    this._wireSupervisors();
    this.ramPin = this._createRamPin();
  }


  serverForRole(role) {
    const normalized = ImageSlotRoles.normalize(role);
    return this.slots().find((slot) => slot.role === normalized).server;
  }

  slots() {
    return [
      { role: ImageSlotRoles.GENERATE, server: this.runtimeServer, defaultKey: 'modelId' },
      { role: ImageSlotRoles.EDIT, server: this.editRuntimeServer, defaultKey: 'editModelId' },
      { role: ImageSlotRoles.VIDEO, server: this.videoRuntimeServer, defaultKey: 'videoModelId' },
    ];
  }

  getApiKeyForLaunch() {
    if (!this.apiSecurity) return { required: false, key: null, keyCount: 0 };
    const cfg = this.apiSecurity.getConfig();
    const keys = Array.isArray(cfg.apiKeys) ? cfg.apiKeys : [];
    return { required: !!cfg.requireApiKey, key: keys.length > 0 ? keys[0].key : null, keyCount: keys.length };
  }

  getAutoUnloadMs() { return this._settings.getAutoUnloadMs(); }

  setAutoUnloadMs(ms) {
    const value = this._settings.setAutoUnloadMs(ms);
    this._applyIdleTimeout(value);
    return value;
  }


  isEnabled() { return this._settings.isEnabled(); }

  async setEnabled(enabled) {
    const next = !!enabled;
    if (next === this.isEnabled()) return { success: true, enabled: next };
    this._settings.setEnabled(next);
    if (!next) await this._stopAllSlots();
    return { success: true, enabled: next };
  }

  getDefaultModelsDir() { return path.join(this._deps.appBaseDir(), 'models', 'image'); }
  getRuntimesDir() { return path.join(this._deps.appBaseDir(), 'runtimes', 'image'); }
  getModelsDirConfig() { return this._settings.getModelsDirConfig(); }
  setModelsDir(dir) { return this._settings.setModelsDir(dir); }
  getDefaults() { return this._settings.getDefaults(); }
  setDefaults(patch) { return this._settings.setDefaults(patch); }


  getManualRuntimeBinary(runtimeId) { return this._runtimeSettings.getManualRuntimeBinary(runtimeId); }
  setManualRuntimeBinary(runtimeId, binaryPath) { return this._runtimeSettings.setManualRuntimeBinary(runtimeId, binaryPath); }
  getAllManualRuntimeBinaries() { return this._runtimeSettings.getAllManualRuntimeBinaries(); }
  getCachedRuntimesView() { return this._runtimeSettings.getCachedRuntimesView(); }
  setCachedRuntimesView(view) { return this._runtimeSettings.setCachedRuntimesView(view); }
  invalidateRuntimesCache() { return this._runtimeSettings.invalidateRuntimesCache(); }
  ensureRuntimesView(opts) { return this._runtimeSettings.ensureRuntimesView(opts); }


  computeLocalServerEntry(role) { return this._selection.localEntry(role); }
  getRemoteServerConfigs() { return this._remoteServers.list(); }
  saveRemoteServerConfigs(list) { return this._remoteServers.save(list); }
  getServerConfigs() { return this._selection.list(); }
  getActiveServerId(role) { return this._selection.getActiveId(role); }
  setActiveServerId(role, id) { return this._selection.setActiveId(role, id); }
  getActiveServer(role) { return this._selection.getActive(role); }
  isRoleReady(role) { return this._selection.isReady(role, this.isEnabled()); }
  upsertRemoteServer(entry) { return this._remoteServers.upsert(entry); }
  setRemoteServerModel(id, modelId) { return this._remoteServers.setSelectedModel(id, modelId); }
  removeRemoteServer(id) { return this._selection.removeRemote(id); }
  removeServersForPeer(peerId) { return this._selection.removeForPeer(peerId); }
  listInstalledModels(kind = null) { return this._installedModels.list(kind); }


  getModelDisplayNames() { return this._displayNames.all(); }
  setModelDisplayName(key, name) { return this._displayNames.set(key, name); }
  resolveModelDisplayName(stem) { return this._displayNames.resolve(stem); }


  startServerResolved(modelIdOverride, opts = {}) {
    return new ImageSlotLaunch(this, this._launchDeps).run(modelIdOverride, opts);
  }

  async shutdown() {
    for (const { role, server } of this.slots()) {
      try { await server.stop(); } catch (err) { console.warn(`[image-server] shutdown stop() failed (${role}):`, err && err.message); }
    }
  }

  static _resolveDeps(options) {
    return {
      getDiagnostics: typeof options.getDiagnostics === 'function' ? options.getDiagnostics : ImageServerService._uncachedDiagnostics,
      appBaseDir: options.appBaseDir || (() => AppPaths.appBaseDir()),
      runtimeDetector: options.runtimeDetector || ImageRuntimeDetector.shared,
      scanner: options.scanner || new ImageModelsScanner(),
      vramCoordinator: options.vramCoordinator || VramCoordinator.shared,
      hotswap: options.hotswap || HotswapCoordinator.shared,
      launchPlanner: options.launchPlanner || new ImageLaunchPlanner(),
      capabilities: options.capabilities || new SdServerCapabilities(),
      liveMemory: options.liveMemory || ((diagnostics) => CudaDeviceProbe.withLiveMemory(diagnostics)),
      findFreePort: options.findFreePort || ImageServerService._findFreePort,
      log: options.log || ((line) => console.log(line)),
    };
  }

  static _uncachedDiagnostics() {
    return require('../llm-server/SystemDiagnostics').gather({});
  }

  static _findFreePort(role, opts) {
    const Server = role === ImageSlotRoles.VIDEO ? VideoRuntimeServer : ImageRuntimeServer;
    return Server.findFreePort(opts);
  }

  _createStores() {
    this._settings = new ImageServerSettings(this.settingsDb, { defaultModelsDir: () => this.getDefaultModelsDir() });
    this._displayNames = new ImageModelDisplayNames(this.settingsDb);
    this._remoteServers = new RemoteImageServerStore(this.settingsDb);
    this._selection = new ImageServerSelection({
      settingsDb: this.settingsDb,
      remoteServers: this._remoteServers,
      getDefaults: () => this.getDefaults(),
      resolveDisplayName: (stem) => this.resolveModelDisplayName(stem),
    });
    this._installedModels = new InstalledImageModels({
      scanner: this._deps.scanner,
      getModelsDir: () => this.getModelsDirConfig().effectivePath,
      getDefaults: () => this.getDefaults(),
      resolveDisplayName: (stem) => this.resolveModelDisplayName(stem),
    });
    this._runtimeSettings = this._createRuntimeSettings();
    this._launchDeps = this._createLaunchDeps();
  }

  _createRuntimeSettings() {
    return new ManagedRuntimeSettings({
      settingsDb: this.settingsDb,
      cacheKey: ImageServerService.RUNTIMES_CACHE_KEY,
      manualBinaryPrefix: ImageServerService.MANUAL_BINARY_PREFIX,
      catalog: new ImageRuntimeCatalog(),
      runtimeKind: 'image-inference',
      detectRuntimes: (inputs) => this._deps.runtimeDetector.detectRuntimes(inputs),
      getRuntimesDir: () => this.getRuntimesDir(),
      getDiagnostics: () => this._deps.getDiagnostics(),
    });
  }

  _createLaunchDeps() {
    const deps = this._deps;
    return {
      ...deps,
      inputs: new ImageLaunchInputs({ runtimeDetector: deps.runtimeDetector, scanner: deps.scanner }),
      placement: new ImageSlotPlacement({ vramCoordinator: deps.vramCoordinator, capabilities: deps.capabilities }),
    };
  }

  _createSupervisors() {
    this.runtimeServer = new ImageRuntimeServer({ apiSecurity: this.apiSecurity });
    this.editRuntimeServer = new ImageRuntimeServer({ apiSecurity: this.apiSecurity });
    this.videoRuntimeServer = new VideoRuntimeServer({ apiSecurity: this.apiSecurity });
  }

  _wireSupervisors() {
    this._applyIdleTimeout(this.getAutoUnloadMs());
    for (const { role, server } of this.slots()) {
      this._deps.vramCoordinator.releaseOnIdle(server, role);
      this._deps.vramCoordinator.markResidentOnReady(server, role);
    }
  }

  _createRamPin() {
    const target = new ImagePinTarget({ scanner: this._deps.scanner });
    return new RamPinService({
      name: ImageServerService.RAM_PIN_NAME,
      isEnabled: () => !!this.getDefaults().pinModelRam,
      resolveTarget: () => target.resolve(this),
    });
  }

  _applyIdleTimeout(ms) {
    for (const { server } of this.slots()) server.setIdleTimeout(ms);
  }

  async _stopAllSlots() {
    for (const { server } of this.slots()) {
      try { await server.stop(); } catch (_) {}
    }
  }
}

module.exports = ImageServerService;
