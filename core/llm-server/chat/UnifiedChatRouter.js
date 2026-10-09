const AgentChatBridge = require('./AgentChatBridge');
const ChatModeRegistry = require('./ChatModeRegistry');
const Compaction = require('./Compaction');
const ChatAdapterRegistry = require('../server/chat/ChatAdapterRegistry');
const ServerLauncher = require('../server/ServerLauncher');
const LlmRuntimeCatalog = require('../runtimes/LlmRuntimeCatalog');
const LlmModelsScanner = require('../LlmModelsScanner');
const ModelContextWindow = require('./router/ModelContextWindow');
const ModelCapabilities = require('./router/ModelCapabilities');
const AgentToolPolicy = require('./router/AgentToolPolicy');
const SystemPromptPreview = require('./router/SystemPromptPreview');
const ChatModelList = require('./router/ChatModelList');
const RemoteStream = require('./router/RemoteStream');
const LocalServerPrep = require('./router/LocalServerPrep');
const LocalRequest = require('./router/LocalRequest');
const LocalStream = require('./router/LocalStream');
const ModelDispatcher = require('./router/ModelDispatcher');
const AgentCompletion = require('./router/AgentCompletion');
const SideCompletion = require('./router/SideCompletion');
const TitleGenerator = require('./router/TitleGenerator');
const CompactionGate = require('./router/CompactionGate');
const ThinkingDial = require('./router/ThinkingDial');
const AgentTurnDispatch = require('./router/AgentTurnDispatch');
const InFlightTurn = require('./router/InFlightTurn');
const LocalSlotReclaimer = require('./router/LocalSlotReclaimer');
const ModeReaction = require('./router/ModeReaction');
const ChatModeTurn = require('./router/ChatModeTurn');
const TurnConversation = require('./router/TurnConversation');
const AttachmentArtifacts = require('./router/AttachmentArtifacts');
const ChatTurn = require('./router/ChatTurn');
const ProxyTurns = require('./router/ProxyTurns');
const ArtifactAccess = require('./router/ArtifactAccess');

class UnifiedChatRouter {
  constructor({ llmServerService, db, getAgentDeps, ...seams }) {
    this.llmServerService = llmServerService;
    this.db = db;
    this._agentDepsGetter = typeof getAgentDeps === 'function' ? getAgentDeps : null;
    this.agentBridge = seams.agentBridge || new AgentChatBridge({ router: this });
    this._inFlight = new InFlightTurn();
    this._build(seams);
    global.__lumaChatRouter = this;
  }

  get chatStore() { return this.llmServerService.chatStore; }

  get active() { return this._inFlight.handle; }

  getAgentDeps() {
    return this._agentDepsGetter ? this._agentDepsGetter() : null;
  }


  listModels() { return this._models.list(); }
  contextWindowFor(modelRef) { return this._window.forRef(modelRef); }
  modelVisionActive(modelRef) { return this._caps.visionActive(modelRef); }
  modelNativeToolsActive(modelRef) { return this._caps.nativeToolsActive(modelRef); }
  modelNativeToolExclude(modelRef) { return this._caps.nativeToolExclude(modelRef); }


  previewSystemPrompt(opts = {}) { return this._preview.build(opts); }
  getAgentToolCatalog() { return this._policy.catalog(); }
  resolveAllowedTools(convId, deps = null) { return this._policy.allowedFor(convId, deps); }
  setGlobalToolEnabled(name, enabled) { return this._policy.setGlobalEnabled(name, enabled); }


  chat(args) {
    return new ChatTurn(this._turnDeps).run(args);
  }

  abort() {
    try { this.agentBridge.abort(); } catch (_) {}
    if (this._inFlight.abort()) this._reclaimer.reclaim();
    return { success: true };
  }

  generateTitle(conversationId) { return this._titles.generate(conversationId); }
  complete(opts) { return this._side.complete(opts); }
  completeStream(opts, ext) { return this._side.completeStream(opts, ext); }

  _completeOnce(modelRef, messages, temperature, onStatus, onToken, onReasoningToken, onUsage, onTimings,
    images = [], tools = null, extra = null, ctl = null) {
    return this._agentCompletion.completeOnce(modelRef, messages, temperature, onStatus, onToken, onReasoningToken,
      onUsage, onTimings, images, tools, extra, ctl);
  }


  proxyStream(opts) { return this._proxy.stream(opts); }
  proxyAgent(opts) { return this._proxy.agent(opts); }


  respondTakeover(action) {
    try { return !!(this.agentBridge && this.agentBridge.respondTakeover(action)); } catch (_) { return false; }
  }

  respondApproval(decision) {
    try { return !!(this.agentBridge && this.agentBridge.respondApproval(decision)); } catch (_) { return false; }
  }


  getArtifact(id) { return this._artifacts.get(id); }
  getArtifactHtml(id, opts) { return this._artifacts.html(id, opts); }
  getArtifactData(idOrRootId) { return this._artifacts.data(idOrRootId); }
  mutateArtifactData(idOrRootId, ops) { return this._artifacts.mutate(idOrRootId, ops); }
  listConversationArtifacts(conversationId) { return this._artifacts.listFor(conversationId); }


  _build(seams) {
    const getAgentDeps = () => this.getAgentDeps();
    this._buildModelSide();
    this._buildDispatch(seams);
    this._buildToolSide(getAgentDeps);
    this._buildCompletions(seams);
    this._buildTurnSide(seams, getAgentDeps);
  }

  _buildModelSide() {
    const shared = { llmServerService: this.llmServerService, db: this.db };
    this._window = new ModelContextWindow(shared);
    this._caps = new ModelCapabilities(shared);
    this._models = new ChatModelList(shared);
  }

  _buildDispatch(seams) {
    const service = this.llmServerService;
    const prep = new LocalServerPrep({
      llmServerService: service,
      launcher: seams.launcher || ServerLauncher.shared,
      scanner: seams.scanner || LlmModelsScanner.shared,
      imageServerService: seams.imageServerService || (() => global.__lumaImageServerService || null),
    });
    const request = new LocalRequest({
      llmServerService: service,
      runtimeCatalog: seams.runtimeCatalog || LlmRuntimeCatalog.shared,
      adapterRegistry: seams.adapterRegistry || ChatAdapterRegistry,
    });
    this._dispatcher = seams.dispatcher || new ModelDispatcher({
      db: this.db,
      localStream: new LocalStream({ llmServerService: service, prep, request }),
      remoteStream: new RemoteStream({ db: this.db }),
    });
    this._dispatch = (...args) => this._dispatcher.dispatch(...args);
    this._reclaimer = new LocalSlotReclaimer({ llmServerService: service, isLocalTurnLive: () => this._inFlight.isLocalLive() });
  }

  _buildToolSide(getAgentDeps) {
    this._policy = new AgentToolPolicy({ db: this.db, chatStore: this._store(), getAgentDeps });
    this._preview = new SystemPromptPreview({ policy: this._policy, agentBridge: this.agentBridge, getAgentDeps });
    this._artifacts = new ArtifactAccess({ getAgentDeps });
    this._proxy = new ProxyTurns({
      llmServerService: this.llmServerService,
      dispatch: this._dispatch,
      agentBridge: this.agentBridge,
      getAgentDeps,
      reclaimer: this._reclaimer,
    });
  }

  _buildCompletions(seams) {
    this._agentCompletion = new AgentCompletion({
      dispatch: this._dispatch,
      nativeToolsActive: (ref) => this._caps.nativeToolsActive(ref),
      isBridgeAborted: () => !!(this.agentBridge && this.agentBridge.isAborted && this.agentBridge.isAborted()),
    });
    this._side = new SideCompletion({ dispatch: this._dispatch, models: this._models });
    this._titles = new TitleGenerator({ chatStore: this._store(), models: this._models, dispatch: this._dispatch });
    this._compaction = new CompactionGate({
      llmServerService: this.llmServerService,
      db: this.db,
      contextWindow: this._window,
      compaction: seams.compaction || new Compaction(),
      complete: (opts) => this.complete(opts),
    });
  }

  _buildTurnSide(seams, getAgentDeps) {
    const chatStore = this._store();
    this._turnDeps = {
      chatStore,
      getDocs: typeof seams.getDocsKnowledgeBase === 'function' ? seams.getDocsKnowledgeBase : () => null,
      conversation: new TurnConversation({ chatStore, llmServerService: this.llmServerService }),
      attachments: new AttachmentArtifacts({ chatStore, getAgentDeps }),
      modes: new ChatModeTurn({ chatStore, modeRegistry: seams.modeRegistry || ChatModeRegistry.shared }),
      reaction: new ModeReaction({ chatStore }),
      contextWindow: this._window,
      compaction: this._compaction,
      thinking: new ThinkingDial({ llmServerService: this.llmServerService, chatStore }),
      agentDispatch: new AgentTurnDispatch({
        agentBridge: this.agentBridge, chatStore, getAgentDeps, policy: this._policy, contextWindow: this._window,
      }),
      dispatcher: this._dispatcher,
      inFlight: this._inFlight,
      reclaimer: this._reclaimer,
    };
  }

  _store() {
    return (this.llmServerService && this.llmServerService.chatStore) || null;
  }
}

module.exports = UnifiedChatRouter;
