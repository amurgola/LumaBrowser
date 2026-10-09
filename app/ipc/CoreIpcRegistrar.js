const TelemetryIpcHandlers = require('../../core/telemetry/TelemetryIpcHandlers');
const SettingsIpcHandlers = require('../../core/shell/SettingsIpcHandlers');
const ShellIpcHandlers = require('../../core/shell/ShellIpcHandlers');
const ChromeExtensionIpcHandlers = require('../../core/chrome-extensions/ChromeExtensionIpcHandlers');
const AdblockerIpcHandlers = require('../../core/adblocker/AdblockerIpcHandlers');
const ProviderConfigIpcHandlers = require('../../core/llm-service/ProviderConfigIpcHandlers');
const LlmIpcHandlers = require('../../core/llm-service/LlmIpcHandlers');
const LlmServerIpcHandlers = require('../../core/llm-server/LlmServerIpcHandlers');
const LocalApiIpcHandlers = require('../../core/llm-server/LocalApiIpcHandlers');
const DashboardIpcHandlers = require('../../core/dashboard/DashboardIpcHandlers');
const RagIpcHandlers = require('../../core/rag/RagIpcHandlers');
const BrowserDataIpcHandlers = require('../../core/browser-data/BrowserDataIpcHandlers');
const ImageIpcHandlers = require('../../core/image-server/ImageIpcHandlers');
const VideoIpcHandlers = require('../../core/image-server/VideoIpcHandlers');
const MusicIpcHandlers = require('../../core/music-server/MusicIpcHandlers');
const WhisperIpcHandlers = require('../../core/whisper-server/WhisperIpcHandlers');
const TtsIpcHandlers = require('../../core/tts-server/TtsIpcHandlers');
const GroundingIpcHandlers = require('../../core/grounding-server/GroundingIpcHandlers');
const SharingIpcHandlers = require('../../core/network-sharing/SharingIpcHandlers');
const PlacementIpcHandlers = require('../../core/placement/PlacementIpcHandlers');
const LabIpcHandlers = require('../../core/roleplay-lab/LabIpcHandlers');
const AppGlobals = require('../AppGlobals');
const ChatTaskServices = require('../services/ChatTaskServices');
const WindowControlIpc = require('./WindowControlIpc');

class CoreIpcRegistrar {
  constructor(ctx, { ipcMain, updateCheck = null, debugIpc = null }) {
    this._ctx = ctx;
    this._s = ctx.services;
    this._ipcMain = ipcMain;
    this._updateCheck = updateCheck;
    this._debugIpc = debugIpc;
  }

  register() {
    if (this._updateCheck) this._updateCheck.register(this._ipcMain);
    this._registerSettings();
    const chat = this._registerLlmServer();
    this._registerChatSurfaces();
    const media = this._registerMediaServers();
    this._registerSharingAndPlacement();
    new WindowControlIpc(() => this._ctx.mainWindow).register(this._ipcMain);
    this._registerLlmSettings();
    this._registerShell();
    if (this._debugIpc) this._debugIpc.register(this._ipcMain);
    return { chat, ...media };
  }

  _registerSettings() {
    const s = this._s;
    new TelemetryIpcHandlers(s.telemetryConsent, (consent) => CoreIpcRegistrar.applyConsent(consent, s.pulseService)).register();
    new SettingsIpcHandlers({
      db: s.db,
      restGateway: s.restGateway,
      mcpAggregator: s.mcpAggregator,
      apiSecurity: s.apiSecurity,
      mainWindowGetter: () => this._ctx.mainWindow,
      rootDir: this._ctx.rootDir,
      cliShim: s.cliShim,
      idePlugin: s.idePlugin,
      vscodeExtension: s.vscodeExtension,
      onSetupFinalized: () => this._ctx.deferredServices.start(),
    }).register();
    new ChromeExtensionIpcHandlers(s.chromeExtensionService).register();
    new AdblockerIpcHandlers(s.adblockerService).register();
  }

  _registerLlmServer() {
    const s = this._s;
    const { router } = LlmServerIpcHandlers.register(s.llmServerService, {
      db: s.db,
      getAgentDeps: () => this._ctx.agentDeps,
      artifactDataStore: s.artifactDataStore,
      artifactTaskStore: s.artifactTaskStore,
      scheduledTaskStore: s.scheduledTaskStore,
      scheduledTaskScheduler: s.scheduledTaskScheduler,
      emitSchedTasksEvent: s.emitSchedTasksEvent,
      triggerStore: s.triggerStore,
      triggerRunner: s.triggerRunner,
      fileWatchManager: s.fileWatchManager,
      notificationSource: s.notificationSource,
      triggerSecrets: s.triggerSecrets,
      emitTriggersEvent: s.emitTriggersEvent,
      getHookBaseUrls: s.getHookBaseUrls,
      imageServerService: s.imageServerService,
      musicServerService: s.musicServerService,
      dashboardService: s.dashboardService,
      liveApi: s.liveApi,
      docsKnowledgeBase: s.docsKnowledgeBase,
      getExtensionManager: () => s.extensionManager,
    });
    return router;
  }

  _registerChatSurfaces() {
    const s = this._s;
    const getMainWindow = () => this._ctx.mainWindow;
    new DashboardIpcHandlers({
      dashboardService: s.dashboardService,
      getAgentDeps: () => this._ctx.agentDeps,
      llmServerService: s.llmServerService,
      artifactTaskStore: s.artifactTaskStore,
      artifactTaskScheduler: s.artifactTaskScheduler,
      getChatStore: ChatTaskServices.chatStore,
      getExtensionManager: () => s.extensionManager,
    }).register();
    new RagIpcHandlers(s.ragService, { getMainWindow }).register();
    new BrowserDataIpcHandlers({ historyService: s.historyService, bookmarkService: s.bookmarkService, db: s.db, getMainWindow, faviconCache: s.faviconCache }).register();
  }

  _registerMediaServers() {
    const s = this._s;
    const notify = (message, type) => this._ctx.notifyModelStatus(message, type);
    const image = AppGlobals.publish('__lumaImageRouter', ImageIpcHandlers.register(s.imageServerService, { notify }).router);
    const video = AppGlobals.publish('__lumaVideoRouter', VideoIpcHandlers.register(s.imageServerService, { notify }).router);
    const music = AppGlobals.publish('__lumaMusicRouter', MusicIpcHandlers.register(s.musicServerService, { notify }).router);
    WhisperIpcHandlers.register(s.whisperServerService);
    TtsIpcHandlers.register(s.ttsServerService);
    GroundingIpcHandlers.register({ groundingServerService: s.groundingServerService, llmService: s.llmService });
    return { image, video, music };
  }

  _registerSharingAndPlacement() {
    const s = this._s;
    new SharingIpcHandlers({ hostService: s.sharingHostService, clientService: s.sharingClientService, getPorts: s.sharingPorts.getter() }).register();
    LocalApiIpcHandlers.register(s.localApiServer);
    new PlacementIpcHandlers(s.placementService).register();
    new LabIpcHandlers(() => global.__lumaRpLabService || null).register();
  }

  _registerLlmSettings() {
    const s = this._s;
    new LlmIpcHandlers({ db: s.db, lmStudioService: s.lmStudioService, anthropicService: s.anthropicService, llmService: s.llmService, getMainWindow: () => this._ctx.mainWindow }).register();
    new ProviderConfigIpcHandlers({ db: s.db, lmStudioService: s.lmStudioService, anthropicService: s.anthropicService, llmServerService: s.llmServerService }).register();
  }

  _registerShell() {
    const s = this._s;
    new ShellIpcHandlers({
      extensionManager: s.extensionManager,
      mainWindowGetter: () => this._ctx.mainWindow,
      rootDir: this._ctx.rootDir,
      identity: s.machineIdentity,
      waitForExtensions: () => (s.db.get('core.setupComplete', false) ? this._ctx.deferredServices.start() : undefined),
    }).register();
  }

  static applyConsent(consent, pulseService) {
    if (consent.allowed) pulseService.start();
    else pulseService.stop();
    return consent.allowed;
  }
}

module.exports = CoreIpcRegistrar;
