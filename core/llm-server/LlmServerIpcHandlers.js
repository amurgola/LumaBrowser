const { ipcMain, app } = require('electron');
const IpcEnvelope = require('../shared/ipc/IpcEnvelope');
const PathPicker = require('../shared/ipc/PathPicker');
const SenderStream = require('../shared/ipc/SenderStream');
const SystemDiagnostics = require('./SystemDiagnostics');
const Preflight = require('./Preflight');
const UnifiedChatRouter = require('./chat/UnifiedChatRouter');
const ChatModeRegistry = require('./chat/ChatModeRegistry');
const LiveApi = require('./chat/LiveApi');
const WorkspaceFiles = require('./chat/WorkspaceFiles');
const WorkspaceFileIpcHandlers = require('./chat/workspace/WorkspaceFileIpcHandlers');
const CuratedModelCatalog = require('./models/CuratedModelCatalog');
const ServerLauncher = require('./server/ServerLauncher');
const AddonModelInstaller = require('./ipc/AddonModelInstaller');
const ApprovalPolicySetting = require('./ipc/ApprovalPolicySetting');
const ArtifactActions = require('./ipc/ArtifactActions');
const PageContextActions = require('./ipc/PageContextActions');
const AutoSetupPlan = require('./ipc/AutoSetupPlan');
const ChatAttachments = require('./ipc/ChatAttachments');
const ChatDataReset = require('./ipc/ChatDataReset');
const ChatModeIntent = require('./ipc/ChatModeIntent');
const ChatTurnRequest = require('./ipc/ChatTurnRequest');
const ConversationActions = require('./ipc/ConversationActions');
const ConversationDeletion = require('./ipc/ConversationDeletion');
const ConversationExporter = require('./ipc/ConversationExporter');
const DebugLogsView = require('./ipc/DebugLogsView');
const ExistingLlmModels = require('./ipc/ExistingLlmModels');
const FitTestSession = require('./ipc/FitTestSession');
const GambitSession = require('./ipc/GambitSession');
const HfRepoBrowser = require('./ipc/HfRepoBrowser');
const HiddenRunConversations = require('./ipc/HiddenRunConversations');
const LlmAvailability = require('./ipc/LlmAvailability');
const LlmDefaultsUpdater = require('./ipc/LlmDefaultsUpdater');
const LlmDiagnosticsView = require('./ipc/LlmDiagnosticsView');
const LlmDownloadSlot = require('./ipc/LlmDownloadSlot');
const LlmIpcDeps = require('./ipc/LlmIpcDeps');
const LlmModelsView = require('./ipc/LlmModelsView');
const LlmRuntimeSetup = require('./ipc/LlmRuntimeSetup');
const LlmServerBroadcast = require('./ipc/LlmServerBroadcast');
const LocalModelOptions = require('./ipc/LocalModelOptions');
const MlxRepoInstall = require('./ipc/MlxRepoInstall');
const ModelFileDownloader = require('./ipc/ModelFileDownloader');
const ModelWizard = require('./ipc/ModelWizard');
const PeerGpuView = require('./ipc/PeerGpuView');
const QuickChat = require('./ipc/QuickChat');
const ScheduledTaskActions = require('./ipc/ScheduledTaskActions');
const SetupTabActions = require('./ipc/SetupTabActions');
const SideCompletions = require('./ipc/SideCompletions');
const SystemLibrariesCheck = require('./ipc/SystemLibrariesCheck');
const TraceCallsSetting = require('./ipc/TraceCallsSetting');
const TriggerActions = require('./ipc/TriggerActions');
const WorkspaceFileViewer = require('./ipc/WorkspaceFileViewer');

class LlmServerIpcHandlers {
  static PREFIX = 'core.llmServer.';
  static DEBUG_LOGS_CHANNEL = 'core.debug.getLogs';
  static RUNTIME_EVENT_CHANNEL = 'core.llmServer.runtimeEvent';
  static FIT_TEST_EVENT_CHANNEL = 'core.llmServer.fitTestEvent';
  static GAMBIT_EVENT_CHANNEL = 'core.llmServer.gambitEvent';
  static CHAT_EVENT_CHANNEL = 'core.llmServer.chatEvent';
  static MODEL_EVENT_CHANNEL = 'core.llmServer.modelEvent';
  static ADDON_EVENT_CHANNEL = 'core.llmServer.addonEvent';

  static register(llmServerService, deps = {}) {
    const ipcDeps = new LlmIpcDeps(deps);
    const router = new UnifiedChatRouter({
      llmServerService, db: ipcDeps.get('db'), getAgentDeps: () => ipcDeps.agentDeps(),
      getDocsKnowledgeBase: () => ipcDeps.get('docsKnowledgeBase'),
    });
    const s = LlmServerIpcHandlers._services(llmServerService, ipcDeps, router);
    LlmServerBroadcast.wire(llmServerService.runtimeServer);
    s.availability.watch();
    LlmServerIpcHandlers._registerSettings(llmServerService, s);
    LlmServerIpcHandlers._registerDiagnostics(llmServerService, s);
    LlmServerIpcHandlers._registerModelsDir(llmServerService, s);
    LlmServerIpcHandlers._registerRuntimes(s);
    LlmServerIpcHandlers._registerDefaults(llmServerService, s);
    LlmServerIpcHandlers._registerServer(llmServerService, router, s);
    LlmServerIpcHandlers._registerFitAndGambit(llmServerService, s);
    LlmServerIpcHandlers._registerChat(router, s);
    LlmServerIpcHandlers._registerScheduledTasks(s);
    LlmServerIpcHandlers._registerTriggers(s);
    LlmServerIpcHandlers._registerConversations(router, s);
    LlmServerIpcHandlers._registerChatSettings(router, s);
    WorkspaceFileIpcHandlers.register(ipcMain, s.workspace);
    LlmServerIpcHandlers._registerModesAndSetupTabs(s);
    LlmServerIpcHandlers._registerArtifacts(ipcDeps, s);
    LlmServerIpcHandlers._registerAttachments(s);
    LlmServerIpcHandlers._registerWizard(llmServerService, s);
    LlmServerIpcHandlers._registerDownloads(s);
    LlmServerIpcHandlers._registerUiState(llmServerService);
    return { router };
  }

  static _services(svc, deps, router) {
    const workspace = new WorkspaceFiles({ chatRouter: router });
    const runConversations = new HiddenRunConversations({ llmServerService: svc });
    const schedTasks = new ScheduledTaskActions({ deps, runConversations });
    const triggers = new TriggerActions({ deps, runConversations });
    const modelsView = new LlmModelsView({ llmServerService: svc });
    const fitTests = new FitTestSession({ llmServerService: svc });
    const wizard = new ModelWizard({ llmServerService: svc });
    const slot = new LlmDownloadSlot();
    return {
      workspace, schedTasks, triggers, modelsView, fitTests, wizard, slot,
      availability: new LlmAvailability({ llmServerService: svc, chatRouter: router }),
      trace: new TraceCallsSetting(deps.get('db')),
      diagnostics: new LlmDiagnosticsView(svc),
      existing: new ExistingLlmModels({ llmServerService: svc, modelsView }),
      runtimes: new LlmRuntimeSetup({ llmServerService: svc }),
      sysLibs: new SystemLibrariesCheck({ llmServerService: svc, deps }),
      defaults: new LlmDefaultsUpdater(svc),
      gambit: new GambitSession({ llmServerService: svc, chatRouter: router, fitTests }),
      localModels: new LocalModelOptions({ llmServerService: svc }),
      quickChat: new QuickChat({ llmServerService: svc, chatRouter: router }),
      side: new SideCompletions(router),
      approval: new ApprovalPolicySetting(svc.settingsDb),
      viewer: new WorkspaceFileViewer(workspace),
      intent: new ChatModeIntent(svc),
      setupTabs: new SetupTabActions(),
      conversations: new ConversationActions(svc),
      deletion: new ConversationDeletion({ llmServerService: svc, deps, schedTasks, triggers, workspaceFiles: workspace }),
      exporter: new ConversationExporter({ llmServerService: svc, deps }),
      reset: new ChatDataReset({ deps }),
      artifacts: new ArtifactActions(deps),
      liveApi: deps.get('liveApi') || new LiveApi({ getAgentDeps: () => deps.agentDeps() }),
      attachments: new ChatAttachments(),
      pageContext: new PageContextActions(deps),
      docsStatus: () => LlmServerIpcHandlers._docsStatus(deps.get('docsKnowledgeBase')),
      browser: new HfRepoBrowser({ wizard }),
      autoSetup: new AutoSetupPlan({ llmServerService: svc, deps, wizard }),
      downloader: new ModelFileDownloader({ llmServerService: svc, slot, mlxInstall: new MlxRepoInstall({ slot }) }),
      addons: new AddonModelInstaller({ llmServerService: svc, slot }),
      preflightOptions: () => ({ llmServerService: svc, imageServerService: deps.imageServerService(), musicServerService: deps.get('musicServerService') }),
    };
  }

  static _registerSettings(svc, { trace }) {
    LlmServerIpcHandlers._raw('getEnabled', () => svc.isEnabled());
    LlmServerIpcHandlers._handle('setEnabled', (_e, enabled) => svc.setEnabled(enabled));
    LlmServerIpcHandlers._raw('getOpenTabOnLoad', () => svc.getOpenTabOnLoad());
    LlmServerIpcHandlers._handle('setOpenTabOnLoad', (_e, value) => svc.setOpenTabOnLoad(value));
    LlmServerIpcHandlers._raw('getTraceCalls', () => trace.status());
    LlmServerIpcHandlers._handle('setTraceCalls', (_e, value) => trace.set(value));
    LlmServerIpcHandlers._handle('clearTraces', () => trace.clear());
  }

  static _registerDiagnostics(svc, { diagnostics }) {
    LlmServerIpcHandlers._handle('getDiagnostics', (_e, options) => diagnostics.diagnostics(options));
    LlmServerIpcHandlers._handle('getVramPressure', () => ({ state: svc.getVramPressure() }));
    LlmServerIpcHandlers._handle('dismissVramPressure', (_e, card) => ({ dismissed: !!svc.dismissVramPressure(card) }));
    LlmServerIpcHandlers._handle('getUnloadOnVramPressure', () => ({ enabled: !!svc.getUnloadOnVramPressure() }));
    LlmServerIpcHandlers._handle('setUnloadOnVramPressure', (_e, value) => ({ enabled: svc.setUnloadOnVramPressure(value) }));
    LlmServerIpcHandlers._handle('dismissNvidiaSmiPathHint', () => { svc.setNvidiaSmiPathHintDismissed(true); });
    LlmServerIpcHandlers._handle('resetNvidiaSmiPathHint', () => { diagnostics.resetNvidiaSmiPathHint(); });
    LlmServerIpcHandlers._handle('addNvidiaSmiToPath', (_e, directory) => SystemDiagnostics.addDirectoryToUserPath(directory));
    LlmServerIpcHandlers._handle('recoverDisplayDevice', (_e, instanceId) => SystemDiagnostics.recoverDisplayDevice(instanceId));
    LlmServerIpcHandlers._handle('setPcieAspmOff', () => SystemDiagnostics.setPcieAspmOff());
  }

  static _registerModelsDir(svc, { modelsView, existing, sysLibs, preflightOptions }) {
    LlmServerIpcHandlers._handle('getModelsView', () => modelsView.view());
    LlmServerIpcHandlers._handle('getModelDisplayNames', () => ({ names: svc.getModelDisplayNames() }));
    LlmServerIpcHandlers._handle('setModelDisplayName', (_e, key, name) => ({ names: svc.setModelDisplayName(key, name) }));
    LlmServerIpcHandlers._handle('setModelsDir', (_e, dir) => modelsView.setModelsDir(dir));
    LlmServerIpcHandlers._handle('getPreflight', () => Preflight.collectIssues(preflightOptions()));
    LlmServerIpcHandlers._handle('checkSystemLibraries', () => sysLibs.check());
    LlmServerIpcHandlers._handle('getStorageInfo', () => modelsView.storageInfo());
    LlmServerIpcHandlers._handle('scanExistingLibraries', () => existing.scan());
    LlmServerIpcHandlers._handle('importExistingModel', (_e, args) => existing.adopt(args));
    LlmServerIpcHandlers._handle('pickModelsDir', (event) => LlmServerIpcHandlers._pickDir(event, {
      title: 'Choose models directory',
      properties: ['openDirectory', 'createDirectory'],
      defaultPath: svc.getModelsDirConfig().effectivePath,
    }));
    LlmServerIpcHandlers._handle('pickDirectory', (event, opts) => LlmServerIpcHandlers._pickDir(event, {
      title: (opts && opts.title) || 'Choose a folder',
      properties: ['openDirectory'],
    }));
  }

  static _registerRuntimes({ runtimes }) {
    LlmServerIpcHandlers._handle('getRuntimesView', (_e, opts) => runtimes.view(opts));
    LlmServerIpcHandlers._handle('checkRuntimeUpdates', () => runtimes.checkUpdates());
    LlmServerIpcHandlers._handle('getRuntimePrerelease', (_e, id) => runtimes.prerelease(id));
    LlmServerIpcHandlers._handle('pickRuntimeBinary', (event, runtimeId) => runtimes.pickBinary(event, runtimeId));
    LlmServerIpcHandlers._handle('registerRuntimeBinary', (_e, runtimeId, binaryPath) => runtimes.register(runtimeId, binaryPath));
    LlmServerIpcHandlers._handle('locateRuntime', (event, runtimeId) => runtimes.locate(event, runtimeId));
    LlmServerIpcHandlers._handle('installRuntime', (event, id, opts) =>
      runtimes.install(id, opts, SenderStream.create(event, LlmServerIpcHandlers.RUNTIME_EVENT_CHANNEL, { id })));
    LlmServerIpcHandlers._handle('uninstallRuntime', (_e, id) => runtimes.uninstall(id));
  }

  static _registerDefaults(svc, { defaults }) {
    LlmServerIpcHandlers._raw('getDefaults', () => svc.getDefaults());
    LlmServerIpcHandlers._handle('getAutoUnloadMs', () => ({ ms: svc.getAutoUnloadMs() }));
    LlmServerIpcHandlers._handle('setAutoUnloadMs', (_e, ms) => ({ ms: svc.setAutoUnloadMs(ms) }));
    LlmServerIpcHandlers._handle('setDefaults', (_e, payload) => defaults.update(payload));
    LlmServerIpcHandlers._handle('getRamPinStatus', () => ({ status: svc.ramPin.getStatus() }));
    LlmServerIpcHandlers._handle('getGroupRouterStatus', () => ({ status: svc.groupRouter.getStatus() }));
  }

  static _registerServer(svc, router, { availability, localModels }) {
    LlmServerIpcHandlers._handle('getState', () => availability.safeState());
    LlmServerIpcHandlers._raw('getServerStatus', () => svc.runtimeServer.getStatus());
    LlmServerIpcHandlers._handle('getModelCaps', (_e, modelPath) => ({ caps: svc.getModelCaps(modelPath) }), { caps: null });
    LlmServerIpcHandlers._handle('getPeerGpus', () => PeerGpuView.view(), { peers: [], active: false });
    LlmServerIpcHandlers._handle('startServer', () => ServerLauncher.shared.resolveAndStart(svc));
    LlmServerIpcHandlers._handle('stopServer', async () => ({ status: await svc.runtimeServer.stop() }));
    LlmServerIpcHandlers._handle('getLocalModelOptions', () => localModels.options(), { models: [] });
  }

  static _registerFitAndGambit(svc, { fitTests, gambit }) {
    LlmServerIpcHandlers._handle('runFitTest', (event, args) =>
      fitTests.run(args, SenderStream.create(event, LlmServerIpcHandlers.FIT_TEST_EVENT_CHANNEL)));
    LlmServerIpcHandlers._handle('cancelFitTest', () => fitTests.cancel());
    LlmServerIpcHandlers._handle('getFitTestStatus', () => fitTests.status());
    LlmServerIpcHandlers._handle('getFitResults', () => ({ results: svc.getAllFitResults() }), { results: {} });
    LlmServerIpcHandlers._handle('runGambit', (event, args) =>
      gambit.run(args, SenderStream.create(event, LlmServerIpcHandlers.GAMBIT_EVENT_CHANNEL)));
    LlmServerIpcHandlers._handle('cancelGambit', () => gambit.cancel());
    LlmServerIpcHandlers._handle('getGambitStatus', () => gambit.status());
    LlmServerIpcHandlers._handle('getGambitResults', () => ({ results: svc.getAllGambitResults() }), { results: {} });
    LlmServerIpcHandlers._handle('getGambitRaw', () => gambit.raw());
  }

  static _registerChat(router, { quickChat, side }) {
    const chatEvents = (event, args) => SenderStream.create(event, LlmServerIpcHandlers.CHAT_EVENT_CHANNEL, { requestId: args && args.requestId });
    LlmServerIpcHandlers._handle('chat', (event, args) => quickChat.start(args, chatEvents(event, args)));
    LlmServerIpcHandlers._handle('chat.takeoverRespond', (_e, action) => ({ success: router.respondTakeover(String(action || 'continue')) }));
    LlmServerIpcHandlers._handle('chat.approvalRespond', (_e, decision) => ({ success: router.respondApproval(String(decision || 'reject')) }));
    LlmServerIpcHandlers._handle('chatAbort', () => quickChat.abortAll());
    LlmServerIpcHandlers._handle('listModels', () => router.listModels());
    LlmServerIpcHandlers._handle('chat.previewSystemPrompt', (_e, opts) => router.previewSystemPrompt(opts || {}));
    LlmServerIpcHandlers._handleChannel(LlmServerIpcHandlers.DEBUG_LOGS_CHANNEL, () => DebugLogsView.read({ app }));
    LlmServerIpcHandlers._handle('chat2', (event, args) => ChatTurnRequest.run(router, args, chatEvents(event, args)));
    LlmServerIpcHandlers._handle('chat.complete', (_e, args) => side.complete(args));
    LlmServerIpcHandlers._handle('chat.completeStream', (event, args) => side.start(args, chatEvents(event, args)));
    LlmServerIpcHandlers._handle('chat.completeAbort', (_e, requestId) => side.abort(requestId));
  }

  static _registerScheduledTasks({ schedTasks }) {
    LlmServerIpcHandlers._handle('schedTasks.list', () => schedTasks.list(), { tasks: [] });
    LlmServerIpcHandlers._handle('schedTasks.get', (_e, id) => schedTasks.get(id));
    LlmServerIpcHandlers._handle('schedTasks.runs', (_e, taskId, opts) => schedTasks.runs(taskId, opts), { runs: [] });
    LlmServerIpcHandlers._handle('schedTasks.update', (_e, id, patch) => schedTasks.update(id, patch));
    LlmServerIpcHandlers._handle('schedTasks.delete', (_e, id) => schedTasks.delete(id));
    LlmServerIpcHandlers._handle('schedTasks.runNow', (_e, id) => schedTasks.runNow(id));
  }

  static _registerTriggers({ triggers }) {
    LlmServerIpcHandlers._handle('triggers.list', () => triggers.list());
    LlmServerIpcHandlers._handle('triggers.get', (_e, id) => triggers.get(id));
    LlmServerIpcHandlers._handle('triggers.clearMemory', (_e, triggerId) => triggers.clearMemory(triggerId));
    LlmServerIpcHandlers._handle('triggers.persistedTabs', () => triggers.persistedTabs());
    LlmServerIpcHandlers._handle('triggers.versions', (_e, triggerId) => triggers.versions(triggerId));
    LlmServerIpcHandlers._handle('triggers.rollback', (_e, triggerId, n) => triggers.rollback(triggerId, n));
    LlmServerIpcHandlers._handle('triggers.setSecret', (_e, id, value) => triggers.setSecret(id, value));
    LlmServerIpcHandlers._handle('triggers.pickFile', (event, id) => triggers.pickFile(event, id));
    LlmServerIpcHandlers._handle('triggers.runs', (_e, triggerId, opts) => triggers.runs(triggerId, opts));
    LlmServerIpcHandlers._handle('triggers.deliveries', (_e, triggerId, opts) => triggers.deliveries(triggerId, opts));
    LlmServerIpcHandlers._handle('triggers.update', (_e, id, patch) => triggers.update(id, patch));
    LlmServerIpcHandlers._handle('triggers.delete', (_e, id) => triggers.delete(id));
    LlmServerIpcHandlers._handle('triggers.test', (_e, id) => triggers.test(id));
    LlmServerIpcHandlers._handle('triggers.adoptLatestEvent', (_e, id) => triggers.adoptLatestEvent(id));
    LlmServerIpcHandlers._handle('triggers.approve', (_e, runId, decision) => triggers.approve(runId, decision));
    LlmServerIpcHandlers._handle('triggers.simulate', (_e, id, body) => triggers.simulate(id, body));
    LlmServerIpcHandlers._handle('triggers.replay', (_e, runId) => triggers.replay(runId));
  }

  static _registerConversations(router, { conversations: c, deletion, exporter, reset }) {
    LlmServerIpcHandlers._handle('conv.list', (_e, opts) => c.list(opts));
    LlmServerIpcHandlers._handle('conv.get', (_e, id) => c.get(id));
    LlmServerIpcHandlers._handle('conv.create', (_e, data) => c.create(data));
    LlmServerIpcHandlers._handle('conv.rename', (_e, id, title) => c.rename(id, title));
    LlmServerIpcHandlers._handle('conv.delete', (_e, id) => deletion.delete(id));
    LlmServerIpcHandlers._handle('chat.wipeAll', () => reset.wipe());
    LlmServerIpcHandlers._handle('conv.archive', (_e, id, archived) => c.archive(id, archived));
    LlmServerIpcHandlers._handle('conv.pin', (_e, id, pinned) => c.pin(id, pinned));
    LlmServerIpcHandlers._handle('conv.messages', (_e, conversationId) => c.messages(conversationId));
    LlmServerIpcHandlers._handle('conv.export', (event, conversationId, kind) => exporter.export(event, conversationId, kind));
    LlmServerIpcHandlers._handle('conv.variants', (_e, group) => c.variants(group));
    LlmServerIpcHandlers._handle('conv.setVariant', (_e, messageId) => c.setVariant(messageId));
    LlmServerIpcHandlers._handle('conv.addMessage', (_e, msg) => c.addMessage(msg));
    LlmServerIpcHandlers._handle('conv.deleteMessage', (_e, id) => c.deleteMessage(id));
    LlmServerIpcHandlers._handle('conv.updateMessage', (_e, id, patch) => c.updateMessage(id, patch));
    LlmServerIpcHandlers._handle('conv.clearMessages', (_e, id) => c.clearMessages(id));
    LlmServerIpcHandlers._handle('conv.search', (_e, q, opts) => c.search(q, opts));
    LlmServerIpcHandlers._handle('conv.autotitle', (_e, id) => router.generateTitle(id));
    LlmServerIpcHandlers._handle('conv.setTools', (_e, id, enabled) => c.setTools(id, enabled));
    LlmServerIpcHandlers._handle('conv.setDisabledTools', (_e, id, names) => c.setDisabledTools(id, names));
    LlmServerIpcHandlers._handle('conv.setChoices', (_e, id, enabled) => c.setChoices(id, enabled));
    LlmServerIpcHandlers._handle('conv.setReasoningEffort', (_e, id, position) => c.setReasoningEffort(id, position));
    LlmServerIpcHandlers._handle('conv.meta.get', (_e, conversationId) => c.getMeta(conversationId));
    LlmServerIpcHandlers._handle('conv.meta.set', (_e, conversationId, patch) => c.setMeta(conversationId, patch));
  }

  static _registerChatSettings(router, { approval, viewer }) {
    LlmServerIpcHandlers._handle('chat.listModes', () => ({ modes: ChatModeRegistry.shared.list() }), { modes: [] });
    LlmServerIpcHandlers._handle('chat.agentTools', () => router.getAgentToolCatalog(), { groups: [], disabled: [] });
    LlmServerIpcHandlers._handle('chat.getApprovalPolicy', () => approval.get(), { policy: ApprovalPolicySetting.DEFAULT });
    LlmServerIpcHandlers._handle('chat.setApprovalPolicy', (_e, policy) => approval.set(policy));
    LlmServerIpcHandlers._handle('chat.setGlobalToolEnabled', (_e, name, enabled) => router.setGlobalToolEnabled(name, !!enabled));
    LlmServerIpcHandlers._handle('chat.readWorkspaceFile', (_e, args) => viewer.read(args));
  }

  static _registerModesAndSetupTabs({ intent, setupTabs }) {
    LlmServerIpcHandlers._handle('startModeIntent', (_e, args) => intent.start(args));
    LlmServerIpcHandlers._raw('chat.takeIntent', () => intent.take());
    LlmServerIpcHandlers._handle('setup.listTabs', () => setupTabs.list(), { tabs: [] });
    LlmServerIpcHandlers._handle('setup.invoke', (_e, args) => setupTabs.invoke(args));
  }

  static _registerArtifacts(deps, { artifacts, liveApi }) {
    LlmServerIpcHandlers._handle('conv.artifacts', (_e, conversationId) => artifacts.listForConversation(conversationId));
    LlmServerIpcHandlers._handle('artifact.listAll', (_e, opts) => artifacts.listAll(opts));
    LlmServerIpcHandlers._handle('artifact.versions', (_e, idOrRootId) => artifacts.versions(idOrRootId));
    LlmServerIpcHandlers._handle('artifact.get', (_e, id) => artifacts.get(id));
    LlmServerIpcHandlers._handle('artifact.open', (_e, id) => artifacts.open(id));
    LlmServerIpcHandlers._handle('artifact.delete', (_e, id) => artifacts.delete(id));
    LlmServerIpcHandlers._handle('artifact.deleteRoot', (_e, idOrRootId) => artifacts.deleteRoot(idOrRootId));
    const dataStore = deps.get('artifactDataStore');
    if (dataStore) LlmServerIpcHandlers._registerArtifactData(dataStore);
    LlmServerIpcHandlers._raw('liveApi.fetch', (_e, params) => liveApi.fetchPage(params || {}));
    LlmServerIpcHandlers._raw('liveApi.openTab', (_e, params) => liveApi.openTab(params || {}));
    LlmServerIpcHandlers._raw('liveApi.extCall', (_e, params) => liveApi.extCall(params || {}));
  }

  static _registerArtifactData(dataStore) {
    LlmServerIpcHandlers._handle('artifactData.all', (_e, idOrRootId) => dataStore.all(idOrRootId));
    LlmServerIpcHandlers._handle('artifactData.mutate', (_e, idOrRootId, ops) => dataStore.mutate(idOrRootId, ops || {}));
    LlmServerBroadcast.relayArtifactData(dataStore);
  }

  static _registerAttachments({ attachments, pageContext, docsStatus }) {
    LlmServerIpcHandlers._handle('chat.pickAttachment', (event) => attachments.pick(event));
    LlmServerIpcHandlers._handle('chat.readAttachments', (_e, paths) => attachments.readDropped(paths));
    LlmServerIpcHandlers._handle('pageContext.listTabs', () => pageContext.listTabs(), { tabs: [] });
    LlmServerIpcHandlers._handle('pageContext.readTab', (_e, tabId) => pageContext.readTab(tabId));
    LlmServerIpcHandlers._handle('pageContext.readDashboard', () => pageContext.readDashboard());
    LlmServerIpcHandlers._handle('docsSource.status', () => docsStatus(), { available: false });
  }

  static _docsStatus(docs) {
    try {
      return docs && typeof docs.status === 'function' ? docs.status() : { available: false };
    } catch (_) {
      return { available: false };
    }
  }

  static _registerWizard(svc, { wizard, browser, autoSetup }) {
    LlmServerIpcHandlers._handle('modelCatalog', () => ({ models: CuratedModelCatalog.listCatalog() }));
    LlmServerIpcHandlers._handle('modelCatalogLive', (_e, opts) => browser.catalogLive(opts));
    LlmServerIpcHandlers._handle('searchModels', (_e, args) => browser.search(args));
    LlmServerIpcHandlers._handle('expandModelRepo', (_e, repoId, opts) => browser.expand(repoId, opts));
    LlmServerIpcHandlers._handle('getModelReadme', (_e, repoId) => browser.readme(repoId));
    LlmServerIpcHandlers._handle('getWizardHardware', async () => ({ hardware: await wizard.hardware() }));
    LlmServerIpcHandlers._handle('recommendModel', (_e, answers) => wizard.recommend(answers));
    LlmServerIpcHandlers._handle('planAutoSetup', (_e, opts) => autoSetup.plan(opts));
    LlmServerIpcHandlers._handle('openChat', () => ({ success: !!svc.openChat() }));
    LlmServerIpcHandlers._handle('openSetup', (_e, opts) => ({ success: !!svc.openSetup(opts || null) }));
    LlmServerIpcHandlers._raw('consumePendingSetupExpand', () => svc.consumePendingSetupExpand());
  }

  static _registerDownloads({ slot, downloader, addons }) {
    const modelEvents = (event) => SenderStream.create(event, LlmServerIpcHandlers.MODEL_EVENT_CHANNEL);
    LlmServerIpcHandlers._handle('cancelModelDownload', () => { slot.cancel(); });
    LlmServerIpcHandlers._handle('addonModelCatalog', () => addons.catalog());
    LlmServerIpcHandlers._handle('cancelAddonSetup', () => { addons.cancel(); });
    LlmServerIpcHandlers._handle('setupAddonModel', (event, id) =>
      addons.setup(id, SenderStream.create(event, LlmServerIpcHandlers.ADDON_EVENT_CHANNEL, { id })));
    LlmServerIpcHandlers._handle('pauseModelDownload', () => slot.pause());
    LlmServerIpcHandlers._handle('downloadModel', (event, args) => downloader.download(args, modelEvents(event)));
  }

  static _registerUiState(svc) {
    LlmServerIpcHandlers._raw('getUiMode', () => svc.getUiMode());
    LlmServerIpcHandlers._raw('setUiMode', (_e, mode) => svc.setUiMode(mode));
    LlmServerIpcHandlers._raw('getSidebarCollapsed', () => svc.getSidebarCollapsed());
    LlmServerIpcHandlers._raw('setSidebarCollapsed', (_e, v) => svc.setSidebarCollapsed(v));
    LlmServerIpcHandlers._raw('getLastModelRef', () => svc.getLastModelRef());
    LlmServerIpcHandlers._raw('setLastModelRef', (_e, ref) => svc.setLastModelRef(ref));
  }

  static _raw(name, fn) {
    ipcMain.handle(LlmServerIpcHandlers.PREFIX + name, IpcEnvelope.raw(fn));
  }

  static _handle(name, fn, failureFields = null) {
    LlmServerIpcHandlers._handleChannel(LlmServerIpcHandlers.PREFIX + name, fn, failureFields);
  }

  static _handleChannel(channel, fn, failureFields = null) {
    const handler = IpcEnvelope.enveloped(fn);
    ipcMain.handle(channel, failureFields ? async (...args) => ({ ...failureFields, ...(await handler(...args)) }) : handler);
  }

  static async _pickDir(event, dialogOptions) {
    const picked = await PathPicker.pick(event, dialogOptions);
    return picked.canceled ? { canceled: true } : { canceled: false, dir: picked.paths[0] };
  }
}

module.exports = LlmServerIpcHandlers;
