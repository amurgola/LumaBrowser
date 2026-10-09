const path = require('path');
const AppPaths = require('../shared/AppPaths');
const ManagedRuntimeSettings = require('../shared/runtime/ManagedRuntimeSettings');
const VramCoordinator = require('../shared/runtime/VramCoordinator');
const RamPinService = require('../shared/runtime/rampin/RamPinService');
const LlmRuntimeServer = require('./server/LlmRuntimeServer');
const ServerLauncher = require('./server/ServerLauncher');
const VramWatchdog = require('./server/VramWatchdog');
const ModelCapsCache = require('./server/ModelCapsCache');
const RpcPeers = require('./server/RpcPeers');
const LlmRuntimeCatalog = require('./runtimes/LlmRuntimeCatalog');
const LlmRuntimeDetector = require('./runtimes/LlmRuntimeDetector');
const LlmModelsScanner = require('./LlmModelsScanner');
const SystemDiagnostics = require('./SystemDiagnostics');
const ChatStore = require('./ChatStore');
const LegacyChatMigration = require('./LegacyChatMigration');
const EffectiveContext = require('./context/EffectiveContext');
const LlmPinTarget = require('./rampin/LlmPinTarget');
const GroupRouterService = require('./router/GroupRouterService');
const LlmServerSettings = require('./service/LlmServerSettings');
const LlmUiState = require('./service/LlmUiState');
const LlmDefaults = require('./service/LlmDefaults');
const ModelLaunchFlags = require('./service/ModelLaunchFlags');
const LlmModelDisplayNames = require('./service/LlmModelDisplayNames');
const FitResultStore = require('./service/FitResultStore');
const GambitResultStore = require('./service/GambitResultStore');
const NvidiaSmiPathSettings = require('./service/NvidiaSmiPathSettings');
const LlmDiagnosticsCache = require('./service/LlmDiagnosticsCache');
const LocalRequestTracker = require('./service/LocalRequestTracker');
const LocalServerStarter = require('./service/LocalServerStarter');
const RunningModelCaps = require('./service/RunningModelCaps');
const LocalProviderEntry = require('./service/LocalProviderEntry');
const InstalledChatModels = require('./service/InstalledChatModels');
const PinnedLlmTab = require('./service/PinnedLlmTab');
const LlmSupervisorHooks = require('./service/LlmSupervisorHooks');

class LLMServerService {
  static DEFAULT_AUTO_UNLOAD_MS = LlmServerSettings.DEFAULT_AUTO_UNLOAD_MS;
  static RUNTIMES_CACHE_KEY = 'core.llmServer.runtimesCache';
  static MANUAL_BINARY_PREFIX = 'core.llmServer.runtimes.';
  static RAM_PIN_NAME = 'luma-llm-ram-pin';
  static CHANNELS = Object.freeze({
    showChat: 'core.llmServer.showChat',
    showSetup: 'core.llmServer.showSetup',
    openConversation: 'core.llmServer.openConversation',
    modelEvent: 'core.llmServer.modelEvent',
  });

  constructor(settingsDb, options = {}) {
    if (!settingsDb) throw new Error('LLMServerService requires a SettingsDatabase');
    this.settingsDb = settingsDb;
    this.apiSecurity = options.apiSecurity || null;
    this.queueManager = null;
    this._deps = LLMServerService._resolveDeps(options);
    this._createStores(options.rootDir || __dirname);
    this._createSupervisor();
    this._createCompanions();
    this._migrateLegacyChats();
  }


  get tabViewManager() { return this._tab.tabViewManager; }
  get pinnedTabId() { return this._tab.pinnedTabId; }
  get tabHtmlUrl() { return this._tab.tabHtmlUrl; }
  get tabHtmlFileUrl() { return this._tab.tabHtmlFileUrl; }
  get tabHtmlPath() { return this._tab.tabHtmlPath; }
  get tabPreloadPath() { return this._tab.tabPreloadPath; }
  get tabLoadedOk() { return this._tab.tabLoadedOk; }


  beginLocalPrepare() { this._requests.beginPrepare(); }
  endLocalPrepare() { this._requests.endPrepare(); }
  noteLocalRequestStart() { this._requests.start(); }
  noteLocalRequestEnd() { this._requests.end(); }
  onLocalInFlightChange(fn) { return this._requests.onChange(fn); }
  getLocalInFlight() { return this._requests.inFlight(); }

  getLocalSlotCount() {
    const status = this.runtimeServer.getStatus();
    return EffectiveContext.clampSlots(status && status.plan && status.plan.maxConcurrent);
  }

  getEffectiveContext() {
    return EffectiveContext.resolve({ status: this.runtimeServer.getStatus(), defaults: this.getDefaults() });
  }


  ensureRunning(opts) { return this._starter.ensureRunning(opts); }
  whenVisionSettled() { return this._starter.whenVisionSettled(); }


  getVramPressure() { return this.vramWatchdog.getState(); }
  dismissVramPressure(card) { return this.vramWatchdog.dismiss(card); }
  getUnloadOnVramPressure() { return this._settings.getUnloadOnVramPressure(); }
  setUnloadOnVramPressure(value) { return this._settings.setUnloadOnVramPressure(value); }


  setQueueManager(queueManager) { this.queueManager = queueManager || null; }

  syncQueueConcurrency(slots) {
    if (!this.queueManager || typeof this.queueManager.ensureConcurrency !== 'function') return;
    const key = LocalProviderEntry.queueKey(this.computeLocalProviderEntry());
    if (!key) return;
    try { this.queueManager.ensureConcurrency(key, Math.max(1, Math.floor(Number(slots) || 1))); } catch (_) {}
  }

  computeLocalProviderEntry() {
    return LocalProviderEntry.compute({
      defaults: this.getDefaults(),
      port: this.runtimeServer.port,
      resolveDisplayName: (stem) => this.resolveModelDisplayName(stem),
    });
  }

  getApiKeyForLaunch() {
    if (!this.apiSecurity) return { required: false, key: null, keyCount: 0 };
    const cfg = this.apiSecurity.getConfig();
    const keys = Array.isArray(cfg.apiKeys) ? cfg.apiKeys : [];
    return { required: !!cfg.requireApiKey, key: keys.length > 0 ? keys[0].key : null, keyCount: keys.length };
  }


  getUiMode() { return this._ui.getMode(); }
  setUiMode(mode) { return this._ui.setMode(mode); }
  getSidebarCollapsed() { return this._ui.getSidebarCollapsed(); }
  setSidebarCollapsed(collapsed) { return this._ui.setSidebarCollapsed(collapsed); }
  getLastModelRef() { return this._ui.getLastModelRef(); }
  setLastModelRef(ref) { return this._ui.setLastModelRef(ref); }
  setChatIntent(intent) { this._ui.setChatIntent(intent); }
  takeChatIntent() { return this._ui.takeChatIntent(); }
  consumePendingSetupExpand() { return this._ui.consumePendingSetupExpand(); }


  isEnabled() { return this._settings.isEnabled(); }
  getOpenTabOnLoad() { return this._settings.getOpenTabOnLoad(); }
  setOpenTabOnLoad(value) { return { success: true, openTabOnLoad: this._settings.setOpenTabOnLoad(value) }; }
  getDefaultModelsDir() { return path.join(this._deps.appBaseDir(), 'models'); }
  getRuntimesDir() { return path.join(this._deps.appBaseDir(), 'runtimes'); }
  getModelsDirConfig() { return this._settings.getModelsDirConfig(); }
  setModelsDir(dir) { return this._settings.setModelsDir(dir); }
  getAutoUnloadMs() { return this._settings.getAutoUnloadMs(); }

  setAutoUnloadMs(ms) {
    const value = this._settings.setAutoUnloadMs(ms);
    this.runtimeServer.setIdleTimeout(value);
    return value;
  }


  getDefaults() { return this._defaults.get(); }
  setDefaults(patch) { return this._defaults.set(patch); }


  getModelCaps(modelPath) { return this._runningCaps.get(modelPath); }
  getRunningThinking() { return this._runningCaps.runningThinking(); }


  getCachedDiagnostics() { return this._diagnostics.getCached(); }
  setCachedDiagnostics(data) { this._diagnostics.setCached(data); }
  ensureDiagnostics(opts) { return this._diagnostics.ensure(opts); }
  getSavedNvidiaSmiPath() { return this._smiPath.getSavedPath(); }
  setSavedNvidiaSmiPath(smiPath) { this._smiPath.setSavedPath(smiPath); }
  isNvidiaSmiPathHintDismissed() { return this._smiPath.isHintDismissed(); }
  setNvidiaSmiPathHintDismissed(value) { this._smiPath.setHintDismissed(value); }
  getCachedRuntimesView() { return this._runtimeSettings.getCachedRuntimesView(); }
  setCachedRuntimesView(view) { return this._runtimeSettings.setCachedRuntimesView(view); }
  invalidateRuntimesCache() { return this._runtimeSettings.invalidateRuntimesCache(); }
  ensureRuntimesView(opts) { return this._runtimeSettings.ensureRuntimesView(opts); }
  getManualRuntimeBinary(runtimeId) { return this._runtimeSettings.getManualRuntimeBinary(runtimeId); }
  setManualRuntimeBinary(runtimeId, binaryPath) { return this._runtimeSettings.setManualRuntimeBinary(runtimeId, binaryPath); }
  getAllManualRuntimeBinaries() { return this._runtimeSettings.getAllManualRuntimeBinaries(); }


  getAllFitResults() { return this._fitResults.all(); }
  getFitResults(modelPath) { return this._fitResults.get(modelPath); }
  saveFitResults(modelPath, entry) { return this._fitResults.save(modelPath, entry); }
  getAllGambitResults() { return this._gambitResults.all(); }
  getGambitResults(modelPath) { return this._gambitResults.get(modelPath); }
  saveGambitResults(modelPath, entry) { return this._gambitResults.save(modelPath, entry); }
  getModelDisplayNames() { return this._displayNames.all(); }
  setModelDisplayName(key, name) { return this._displayNames.set(key, name); }
  resolveModelDisplayName(stem) { return this._displayNames.resolve(stem); }
  getModelLaunchFlags() { return this._launchFlags.all(); }
  setModelLaunchFlags(key, text) { return this._launchFlags.set(key, text); }
  resolveModelLaunchFlags(modelPathOrStem) { return this._launchFlags.resolve(modelPathOrStem); }
  listInstalledChatModels() { return this._installedModels.list(); }


  attach(tabViewManager) { this._tab.attach(tabViewManager); }
  setWebBaseUrl(baseUrl) { this._tab.setWebBaseUrl(baseUrl); }
  ensurePinnedTab(opts) { return this._tab.ensure(opts); }
  removePinnedTab() { this._tab.remove(); }
  notifyGatewayReady() { this._tab.notifyGatewayReady(); }

  openChat() { return this._tab.openIn(LLMServerService.CHANNELS.showChat); }

  openConversation(conversationId) {
    if (!this.openChat()) return false;
    if (conversationId) this._tab.openIn(LLMServerService.CHANNELS.openConversation, String(conversationId));
    return true;
  }

  openSetup(opts) {
    const payload = LLMServerService._setupPayload(opts);
    this._ui.setMode('setup');
    if (!this.isEnabled()) this._settings.setEnabled(true);
    this._ui.setPendingSetupExpand(payload && payload.expand);
    return this._tab.openIn(LLMServerService.CHANNELS.showSetup, payload);
  }

  async setEnabled(enabled) {
    const next = !!enabled;
    if (next === this.isEnabled()) return { success: true, enabled: next };
    this._settings.setEnabled(next);
    if (next) this._tab.ensure();
    else this._tab.remove();
    return { success: true, enabled: next };
  }

  async shutdown() {
    try {
      await this.runtimeServer.stop();
    } catch (err) {
      console.warn('[llm-server] shutdown stop() failed:', err && err.message);
    }
    try { await this.ramPin.stop(); } catch (_) {}
    try { await this.groupRouter.stop(); } catch (_) {}
  }

  static _resolveDeps(options) {
    return {
      appBaseDir: options.appBaseDir || (() => AppPaths.appBaseDir()),
      runtimeServer: options.runtimeServer || null,
      launcher: options.launcher || ServerLauncher.shared,
      runtimeDetector: options.runtimeDetector || LlmRuntimeDetector.shared,
      runtimeCatalog: options.runtimeCatalog || LlmRuntimeCatalog.shared,
      scanner: options.scanner || LlmModelsScanner.shared,
      gatherDiagnostics: options.gatherDiagnostics || ((opts) => SystemDiagnostics.gather(opts)),
      vramCoordinator: options.vramCoordinator || VramCoordinator.shared,
      releasePeers: options.releasePeers || (() => RpcPeers.releaseAll()),
      vramWatchdogOptions: options.vramWatchdogOptions || {},
      modelCaps: options.modelCaps || null,
      chatStore: options.chatStore || null,
      groupRouter: options.groupRouter || null,
      ramPin: options.ramPin || null,
    };
  }

  static _setupPayload(opts) {
    if (!opts || typeof opts !== 'object') return null;
    let payload = null;
    if (opts.expand) payload = { expand: String(opts.expand) };
    if (opts.page) payload = { ...(payload || {}), page: String(opts.page) };
    return payload;
  }

  _createStores(rootDir) {
    this._settings = new LlmServerSettings(this.settingsDb, { defaultModelsDir: () => this.getDefaultModelsDir() });
    this._ui = new LlmUiState(this.settingsDb, { isConfigured: () => LLMServerService._isConfigured(this.getDefaults()) });
    this._launchFlags = new ModelLaunchFlags(this.settingsDb);
    this._displayNames = new LlmModelDisplayNames(this.settingsDb);
    this._fitResults = new FitResultStore(this.settingsDb);
    this._gambitResults = new GambitResultStore(this.settingsDb);
    this._smiPath = new NvidiaSmiPathSettings(this.settingsDb);
    this._runtimeSettings = this._createRuntimeSettings();
    this._diagnostics = new LlmDiagnosticsCache({
      settingsDb: this.settingsDb,
      smiPath: this._smiPath,
      gather: this._deps.gatherDiagnostics,
      invalidateRuntimes: () => this.invalidateRuntimesCache(),
    });
    this._installedModels = new InstalledChatModels({
      scanner: this._deps.scanner,
      getModelsDir: () => this.getModelsDirConfig().effectivePath,
      getDefaults: () => this.getDefaults(),
      resolveDisplayName: (stem) => this.resolveModelDisplayName(stem),
    });
    this._tab = new PinnedLlmTab({ rootDir, isEnabled: () => this.isEnabled() });
  }

  _createRuntimeSettings() {
    return new ManagedRuntimeSettings({
      settingsDb: this.settingsDb,
      cacheKey: LLMServerService.RUNTIMES_CACHE_KEY,
      manualBinaryPrefix: LLMServerService.MANUAL_BINARY_PREFIX,
      catalog: this._deps.runtimeCatalog,
      runtimeKind: 'inference',
      detectRuntimes: (inputs) => this._deps.runtimeDetector.detectRuntimes(inputs),
      getRuntimesDir: () => this.getRuntimesDir(),
      getDiagnostics: () => this.ensureDiagnostics(),
    });
  }

  _createSupervisor() {
    this.runtimeServer = this._deps.runtimeServer || new LlmRuntimeServer();
    this.runtimeServer.setIdleTimeout(this.getAutoUnloadMs());
    this._requests = new LocalRequestTracker();
    this._starter = new LocalServerStarter({
      service: this, runtimeServer: this.runtimeServer, launcher: this._deps.launcher, tracker: this._requests,
    });
    this.modelCaps = this._deps.modelCaps || new ModelCapsCache({ settingsDb: this.settingsDb });
    this.runtimeServer.recallProbe = (modelPath, templateHash) => this.modelCaps.recallProbe(modelPath, templateHash);
    this._runningCaps = new RunningModelCaps({
      runtimeServer: this.runtimeServer, capsCache: this.modelCaps, getDefaultModelPath: () => this.getDefaults().modelPath,
    });
    this.vramWatchdog = this._createVramWatchdog();
    LlmSupervisorHooks.wire({
      runtimeServer: this.runtimeServer,
      vramCoordinator: this._deps.vramCoordinator,
      releasePeers: this._deps.releasePeers,
      vramWatchdog: this.vramWatchdog,
      runningCaps: this._runningCaps,
    });
  }

  _createVramWatchdog() {
    const rs = this.runtimeServer;
    return new VramWatchdog({
      isLoaded: () => rs.state === 'ready',
      isIdle: () => rs.state === 'ready' && this._requests.inFlight() === 0 && !rs.idleHeld,
      unloadEnabled: () => this.getUnloadOnVramPressure(),
      unload: async () => {
        console.log('[llm-server] unloading: VRAM critically low while idle (core.llm.unloadOnVramPressure)');
        await rs.stop();
      },
      emit: (type, payload) => this._tab.send(LLMServerService.CHANNELS.modelEvent, { type, payload }),
      ...this._deps.vramWatchdogOptions,
    });
  }

  _createCompanions() {
    this.groupRouter = this._deps.groupRouter || new GroupRouterService({ settingsDb: this.settingsDb, llmServerService: this });
    this._defaults = new LlmDefaults({ settingsDb: this.settingsDb, launchFlags: this._launchFlags, groupRouter: this.groupRouter });
    this.ramPin = this._deps.ramPin || this._createRamPin();
    this.chatStore = this._deps.chatStore || new ChatStore(this.settingsDb);
  }

  _createRamPin() {
    const target = new LlmPinTarget({ scanner: this._deps.scanner });
    return new RamPinService({
      name: LLMServerService.RAM_PIN_NAME,
      isEnabled: () => !!this.getDefaults().pinModelRam,
      resolveTarget: () => target.resolve(this),
    });
  }

  _migrateLegacyChats() {
    try {
      new LegacyChatMigration(this.settingsDb, this.chatStore).run();
    } catch (err) {
      console.error('[llm-server] legacy AI-chat conversation migration failed:', err.message);
    }
  }

  static _isConfigured(defaults) {
    return !!(defaults.runtimeId && defaults.modelPath);
  }
}

module.exports = LLMServerService;
