const AgentRunner = require('../../agent/AgentRunner');
const ToolLoopMonitor = require('../ToolLoopMonitor');
const ApprovalPolicy = require('../approval/ApprovalPolicy');
const SilentTab = require('../web-tools/SilentTab');
const WebSession = require('../web-tools/WebSession');
const AgentBudget = require('./AgentBudget');
const BridgeGlobals = require('./BridgeGlobals');
const RunResultSpill = require('./RunResultSpill');
const TabPreviewSession = require('./TabPreviewSession');
const GroupIntent = require('./groups/GroupIntent');
const GroupRouting = require('./groups/GroupRouting');
const RunToolCallParser = require('./parsing/RunToolCallParser');
const ArtifactCatalog = require('./prompt/ArtifactCatalog');
const ImagePromptHint = require('./prompt/ImagePromptHint');
const SystemPromptAppend = require('./prompt/SystemPromptAppend');
const TurnPrompt = require('./prompt/TurnPrompt');
const VisionHint = require('./prompt/VisionHint');
const ApprovalCheck = require('./tools/ApprovalCheck');
const BridgeToolbox = require('./tools/BridgeToolbox');
const ChatToolTable = require('./tools/ChatToolTable');
const NativeToolPlan = require('./tools/NativeToolPlan');
const RunToolSet = require('./tools/RunToolSet');
const ToolCallPipeline = require('./tools/ToolCallPipeline');
const ToolDispatch = require('./tools/ToolDispatch');
const TruncationGuard = require('./tools/TruncationGuard');
const AgentEventRelay = require('./turn/AgentEventRelay');
const CompletionDriver = require('./turn/CompletionDriver');
const ReasoningRelay = require('./turn/ReasoningRelay');
const ReplyCap = require('./turn/ReplyCap');
const RunControl = require('./turn/RunControl');
const RunHealth = require('./turn/RunHealth');
const RunImages = require('./turn/RunImages');
const StreamMirror = require('./turn/StreamMirror');
const ToolTrace = require('./turn/ToolTrace');
const TurnFinisher = require('./turn/TurnFinisher');

class BridgeRun {
  static IMAGES_GROUP = 'images';

  static DEFAULTS = {
    turnReminder: null, images: null, allowedTools: null, refreshAllowedTools: null, systemPromptOverride: null,
    extraTools: null, llmExtra: null, noBrowser: false, ctxPerSlot: null, kbScope: null, allowTakeover: false,
    agentBudget: null, shouldAbort: null, nativeHistory: false, nativeToolsOverride: null, promptExperiments: null,
    approvalOverride: null, pinnedTabId: null, approvalTimeoutMs: null, priorMessages: null, modeSystemPrompt: null,
  };

  constructor(host, options) {
    this._host = host;
    this._router = host.router;
    this._o = { ...BridgeRun.DEFAULTS, ...BridgeRun._defined(options) };
    this._hooks = this._o.hooks;
    this.control = new RunControl({ isBridgeAborted: host.isBridgeAborted, shouldAbort: this._o.shouldAbort });
  }

  start() {
    this._setUpTools();
    this._setUpStreaming();
    this._setUpAgent();
    this._prepareTurn();
    return { abort: () => this.control.stop(), done: this._execute() };
  }

  _setUpTools() {
    const o = this._o;
    this._toolSet = new RunToolSet({
      router: this._router, deps: o.deps, modelRef: o.modelRef, allowedTools: o.allowedTools, extraTools: o.extraTools,
      refreshAllowedTools: o.refreshAllowedTools, kbScope: o.kbScope, conversationId: o.conversationId,
    });
    this._nativePlan = NativeToolPlan.forRun({ router: this._router, modelRef: o.modelRef, override: o.nativeToolsOverride });
    this._budget = AgentBudget.resolve(o.agentBudget, { nativeTools: this._nativePlan.enabled });
    this._health = new RunHealth();
    this._parser = new RunToolCallParser({ health: this._health, maxMalformedReprompts: AgentBudget.maxMalformedReprompts(this._budget) });
    this._trace = new ToolTrace();
    this._artifacts = [];
    this._toolbox = new BridgeToolbox({ parser: this._parser, guard: this._buildGuard() });
  }

  _buildGuard() {
    const o = this._o;
    const dispatch = new ToolDispatch({ table: new ChatToolTable(), toolSet: this._toolSet, ctx: this._toolContext() });
    const approval = new ApprovalCheck({
      db: this._host.db,
      policy: ApprovalPolicy.resolveRun({
        override: o.approvalOverride,
        setting: this._host.db ? this._host.db.get(ApprovalPolicy.SETTING, 'auto') : 'auto',
        interactive: !!o.allowTakeover,
      }),
      toolSet: this._toolSet,
      interactive: o.allowTakeover,
      hooks: this._hooks,
      wait: this._host.approvalWait,
      timeoutMs: o.approvalTimeoutMs,
    });
    const loopMonitor = new ToolLoopMonitor();
    this._health.watchToolLoop(loopMonitor);
    const pipeline = new ToolCallPipeline({ toolSet: this._toolSet, loopMonitor, health: this._health, approval, dispatch });
    return new TruncationGuard({ pipeline, parser: this._parser, toolSet: this._toolSet, router: this._router });
  }

  _toolContext() {
    const o = this._o;
    const browserService = o.deps && o.deps.browserService;
    return {
      conversationId: o.conversationId,
      assistantMessageId: o.assistantMessageId,
      deps: o.deps,
      hooks: this._hooks,
      artifacts: this._artifacts,
      isAborted: this.control.isAborted,
      ctxPerSlot: o.ctxPerSlot,
      kbScope: this._toolSet.kbScope,
      webSession: new WebSession(),
      webTabRender: (!o.noBrowser && browserService) ? SilentTab.make(browserService, { isAborted: this.control.isAborted }) : null,
      allowTakeover: !!o.allowTakeover,
      takeoverWait: this._host.takeoverWait,
    };
  }

  _setUpStreaming() {
    const o = this._o;
    this._mirror = new StreamMirror(this._hooks);
    this._images = new RunImages(o.images);
    this._driver = new CompletionDriver({
      router: this._router, modelRef: o.modelRef, temperature: o.temperature, hooks: this._hooks, llmExtra: o.llmExtra,
      conversationId: o.conversationId, assistantMessageId: o.assistantMessageId, turnReminder: o.turnReminder,
      parallel: this._budget.maxParallelToolCalls > 1, control: this.control, mirror: this._mirror,
      reasoning: new ReasoningRelay(this._hooks), images: this._images, health: this._health,
      replyCap: new ReplyCap(o.ctxPerSlot), parser: this._parser, nativePlan: this._nativePlan, toolSet: this._toolSet,
    });
    this._relay = new AgentEventRelay({
      hooks: this._hooks, mirror: this._mirror, trace: this._trace, images: this._images,
      artifactStore: o.deps && o.deps.artifactStore, artifacts: this._artifacts,
      conversationId: o.conversationId, assistantMessageId: o.assistantMessageId,
    });
  }

  _setUpAgent() {
    const deps = this._o.deps;
    this._agent = new AgentRunner(
      { browserTools: this._toolbox, sendCompletion: this._driver.sendCompletion },
      { browserService: deps.browserService },
      deps.db,
    );
  }

  _prepareTurn() {
    const o = this._o;
    this._turn = TurnPrompt.from(o.messages, { nativeHistory: o.nativeHistory });
    this._toolSet.groups.activate(GroupIntent.infer(this._turn.prompt, this._toolSet.groups.availableKeys));
    this._catalog = ArtifactCatalog.collect(o.priorMessages);
    this._visionHint = VisionHint.forTurn(this._images.count, this._toolSet.visionActive);
  }

  async _execute() {
    const preview = TabPreviewSession.forRouter(this._router, this._hooks);
    let result = null;
    let runError = null;
    try {
      result = await this._runAgent(preview);
    } catch (err) {
      runError = err instanceof Error ? err : new Error(String(err));
    }
    await preview.end().catch(() => {});
    await this._finisher(result).finish({ result, runError });
  }

  async _runAgent(preview) {
    const o = this._o;
    await new GroupRouting(this._router).route(this._turn.prompt, (keys) => this._toolSet.groups.activate(keys));
    const systemPromptAppend = await this._systemPromptAppend();
    const tools = this._toolSet.runToolList({ allowTakeover: o.allowTakeover });
    return this._agent.run({
      prompt: ArtifactCatalog.render(this._catalog) + this._turn.body(),
      priorTurns: this._turn.priorTurns,
      resultSpill: RunResultSpill.create(this._router, o.conversationId, o.assistantMessageId),
      conversationId: o.conversationId,
      tabId: o.pinnedTabId != null ? o.pinnedTabId : undefined,
      lazyTab: o.pinnedTabId == null,
      autoCloseTab: false,
      ...this._budget,
      tools,
      systemPromptAppend,
      systemPromptOverride: o.systemPromptOverride || undefined,
      promptExperiments: o.promptExperiments,
      nativeTools: this._nativePlan.enabled,
      nativeToolsTokens: this._nativePlan.estimateTokens(this._toolSet),
      onToolResultEvicted: (evicted) => this._onToolResultEvicted(evicted),
      noBrowser: o.noBrowser,
      ctxPerSlot: o.ctxPerSlot,
      screenshotVision: this._toolSet.visionActive,
      onEvent: this._relay.handle,
      onWorkTab: o.pinnedTabId != null ? null : (tabId) => preview.start(tabId),
      shouldAbort: this.control.isAborted,
    });
  }

  async _systemPromptAppend() {
    const o = this._o;
    const groups = this._toolSet.groups;
    const imagePromptHint = groups.active.has(BridgeRun.IMAGES_GROUP) ? await ImagePromptHint.fetch(BridgeGlobals.imageRouter()) : null;
    return SystemPromptAppend.build({
      allows: this._toolSet.allows,
      extTools: this._toolSet.allExtTools,
      groups: groups.available,
      visionHint: this._visionHint,
      modeSystemPrompt: o.modeSystemPrompt,
      activeGroups: groups.active,
      imagePromptHint,
      takeover: o.allowTakeover,
      nativeTools: this._nativePlan.enabled,
      nativeExclude: this._nativePlan.exclude,
    });
  }

  _onToolResultEvicted({ tool, params }) {
    const hook = this._toolSet.injected.evictionHooks.get(tool);
    if (!hook) return;
    try { hook(params); } catch (_) {}
  }

  _finisher(result) {
    return new TurnFinisher({
      hooks: this._hooks,
      mirror: this._mirror,
      trace: this._trace,
      artifacts: this._artifacts,
      health: this._health,
      groups: this._toolSet.groups,
      isAborted: this.control.isAborted,
      closeWork: () => this._closeWorkTab(result),
    });
  }

  _closeWorkTab(result) {
    if (!result || !result.createdTab || result.tabId == null) return;
    const browserService = this._o.deps.browserService;
    Promise.resolve().then(() => browserService.closeTab(result.tabId)).catch(() => {});
  }

  static _defined(options) {
    const out = {};
    for (const [key, value] of Object.entries(options || {})) if (value !== undefined) out[key] = value;
    return out;
  }
}

module.exports = BridgeRun;
