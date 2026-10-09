const AgentNotices = require('../../shared/AgentNotices');
const ToolOutputTruncator = require('../chat/ToolOutputTruncator');
const AgentHistory = require('./AgentHistory');
const AgentLoopText = require('./AgentLoopText');
const AgentSystemPromptBuilder = require('./AgentSystemPromptBuilder');
const AgentToolExecutor = require('./AgentToolExecutor');
const CarriedReasoning = require('./CarriedReasoning');
const CompletionSender = require('./CompletionSender');
const CompletionVerifier = require('./CompletionVerifier');
const FinalAnswerGate = require('./FinalAnswerGate');
const MidTurnCompactor = require('./MidTurnCompactor');
const OverflowRecovery = require('./OverflowRecovery');
const RunClock = require('./RunClock');
const RunOptions = require('./RunOptions');
const RunSummary = require('./RunSummary');
const TabLookup = require('./TabLookup');
const ToolBatchParser = require('./ToolBatchParser');
const ToolBatchRunner = require('./ToolBatchRunner');
const ToolCallGuard = require('./ToolCallGuard');
const ToolResultCompactor = require('./ToolResultCompactor');
const WorkTab = require('./WorkTab');

class AgentRun {
  static LAST_STEPS = 2;

  constructor(deps, options) {
    this._deps = deps;
    this._o = RunOptions.normalize(options);
    this._clock = new RunClock(this._o.timeout);
    this._toolCalls = [];
    this._steps = [];
    this._finalResponse = '';
    this._error = null;
    this._iterations = 0;
  }

  async execute() {
    this._setUpComponents();
    await this._workTab.open();
    await this._seedMessages();
    const noticeRun = AgentNotices.beginRun({ conversationId: this._o.conversationId });
    try {
      await this._loop(noticeRun);
      return await this._buildResult();
    } finally {
      noticeRun.end();
    }
  }

  _setUpComponents() {
    this._carriedBudget = CarriedReasoning.resolveBudget(this._o.ctxPerSlot, this._o.carriedReasoning, this._o.nativeTools);
    this._history = new AgentHistory({
      ctxPerSlot: this._o.ctxPerSlot,
      nativeToolsTokens: this._o.nativeToolsTokens,
      carriedTotal: this._carriedBudget.total,
      onEvicted: this._o.onToolResultEvicted,
    });
    this._sender = new CompletionSender(this._deps.llm, { label: this._o.label, clock: this._clock });
    this._workTab = new WorkTab(this._deps.browserService, { requestedTabId: this._o.tabId, lazy: this._o.lazy, onWorkTab: this._o.onWorkTab });
    this._setUpRecovery();
    this._setUpToolSide();
  }

  _setUpRecovery() {
    this._compactor = new MidTurnCompactor({
      enabled: MidTurnCompactor.isEnabled(this._o.ctxPerSlot, this._deps.db),
      ctxPerSlot: this._o.ctxPerSlot,
      nativeToolsTokens: this._o.nativeToolsTokens,
      history: this._history,
      sender: this._sender,
      steps: this._steps,
      emit: (event) => this._emit(event),
      shouldAbort: this._o.shouldAbort,
    });
    this._recovery = new OverflowRecovery({ history: this._history, compactor: this._compactor, sender: this._sender, steps: this._steps });
  }

  _setUpToolSide() {
    const resultCompactor = new ToolResultCompactor(this._o.resultSpill);
    const toolResultBudget = this._o.ctxPerSlot > 0
      ? ToolOutputTruncator.forSlotBudget(this._o.ctxPerSlot).maxBytes
      : ToolOutputTruncator.DEFAULT_MAX_BYTES;
    this._verifier = new CompletionVerifier();
    this._gate = new FinalAnswerGate({ history: this._history, steps: this._steps, emit: (event) => this._emit(event), verifier: this._verifier });
    this._batchRunner = new ToolBatchRunner({
      executor: new AgentToolExecutor({ ...this._deps, screenshotVision: this._o.screenshotVision }),
      guard: new ToolCallGuard({ allowedTools: this._o.tools }),
      compactor: resultCompactor,
      toolResultBudget,
      history: this._history,
      verifier: this._verifier,
      workTab: this._workTab,
      clock: this._clock,
      toolCalls: this._toolCalls,
      steps: this._steps,
      emit: (event) => this._emit(event),
      shouldAbort: this._o.shouldAbort,
      maxParallel: this._o.maxParallel,
      noBrowser: this._o.noBrowser,
    });
  }

  async _seedMessages() {
    this._systemPrompt = new AgentSystemPromptBuilder(this._deps.db).build({
      tabInfo: await this._tabInfo(),
      defaultTabId: this._workTab.promptTabId,
      allowedTools: this._o.tools,
      systemPromptAppend: this._o.systemPromptAppend,
      systemPromptOverride: this._o.systemPromptOverride,
      noBrowser: this._o.noBrowser,
      parallelToolCalls: this._o.maxParallel > 1,
      promptExperiments: this._o.promptExperiments,
    });
    this._history.push('system', this._systemPrompt);
    this._pushPriorTurns();
    this._history.push('user', this._o.prompt);
  }

  async _tabInfo() {
    if (this._o.noBrowser) return AgentLoopText.NO_BROWSER_TAB_INFO;
    if (this._workTab.lazy) return AgentLoopText.LAZY_TAB_INFO;
    return new TabLookup(this._deps.browserService).describe(this._workTab.id);
  }

  _pushPriorTurns() {
    const turns = this._o.priorTurns;
    if (!Array.isArray(turns)) return;
    for (const turn of turns) {
      if (!turn || (turn.role !== 'user' && turn.role !== 'assistant')) continue;
      const content = String(turn.content == null ? '' : turn.content);
      if (content) this._history.push(turn.role, content);
    }
  }

  async _loop(noticeRun) {
    for (let i = 0; i < this._o.maxIterations; i++) {
      if (this._shouldStop(i)) break;
      this._iterations = i + 1;
      await this._prepareRequest(i, noticeRun);
      const result = await this._complete(i);
      if (!result.success) { this._failWith(i, result.error); break; }
      if (await this._handleReply(i, result) === 'stop') break;
    }
  }

  _shouldStop(i) {
    if (this._clock.expired()) {
      this._error = AgentLoopText.timedOut(this._clock.timeoutMs, i, this._o.maxIterations, this._toolCalls);
      return true;
    }
    if (this._aborting()) { this._error = 'aborted'; return true; }
    return false;
  }

  async _prepareRequest(i, noticeRun) {
    this._history.expireScreenshotNote();
    if (this._inLastSteps(i)) this._history.push('user', AgentLoopText.lastSteps(this._o.maxIterations - i));
    if (i > 0) await this._compactor.compactIfOverTrigger(i);
    this._relayNotices(i, noticeRun);
  }

  _relayNotices(i, noticeRun) {
    const notices = noticeRun.drain();
    if (!notices.length) return;
    this._history.appendToLastUser(notices.join('\n'));
    this._steps.push({ iteration: i, notices: notices.length });
  }

  async _complete(i) {
    const messages = this._history.messages;
    const first = i === 0 ? await this._sender.sendFirst(messages) : await this._sender.send(messages);
    return this._recovery.recover(i, first);
  }

  _failWith(i, error) {
    this._error = error || 'LLM completion failed';
    this._steps.push({ iteration: i, llmError: this._error });
  }

  async _handleReply(i, result) {
    this._calibrateFrom(result);
    const message = result.response?.choices?.[0]?.message || {};
    const content = message.content || '';
    const reasoningTail = CarriedReasoning.tail(AgentRun._reasoningOf(message), this._carriedBudget.perStep);
    const batch = ToolBatchParser.parse(this._deps.browserTools, content, this._o.maxParallel);
    this._history.push('assistant', content);
    if (!batch.length) return this._handleNoToolReply(i, content, reasoningTail);
    const notes = reasoningTail ? AgentLoopText.carriedNotes(reasoningTail) : '';
    const { aborted } = await this._batchRunner.run(i, batch, content, notes);
    if (!aborted) return 'next';
    this._error = 'aborted';
    return 'stop';
  }

  _calibrateFrom(result) {
    const promptTokens = Number(result.response?.usage?.prompt_tokens);
    if (promptTokens > 0) this._compactor.calibrate(this._history.chars(), promptTokens);
  }

  _handleNoToolReply(i, content, reasoningTail) {
    if (this._gate.review({ iteration: i, content, reasoningTail, inLastSteps: this._inLastSteps(i) })) return 'next';
    this._finalResponse = content;
    this._steps.push({ iteration: i, assistantContent: content, toolCall: null });
    this._emit({ type: 'final', content });
    return 'stop';
  }

  async _buildResult() {
    const result = {
      finalResponse: this._finalResponse,
      tabId: this._workTab.id,
      createdTab: this._workTab.created,
      iterations: this._iterations,
      durationMs: this._clock.elapsedMs(),
      toolCalls: this._toolCalls,
      steps: this._steps,
      systemPrompt: this._systemPrompt,
      error: this._error,
      overflowRecoveries: this._recovery.count,
      compactions: this._compactor.count,
    };
    if (this._finalResponse && !this._error) result.summary = await RunSummary.generate(this._deps.llm, this._finalResponse, this._toolCalls);
    await this._attachScreenshot(result);
    if (this._o.autoCloseTab) await this._workTab.closeIfOwned();
    return result;
  }

  async _attachScreenshot(result) {
    if (!this._o.includeScreenshot || this._error || this._workTab.id == null) return;
    try {
      const shot = await this._deps.browserService.screenshot(this._workTab.id);
      if (shot.data?.screenshot) result.screenshot = `data:${shot.data.mimeType || 'image/png'};base64,${shot.data.screenshot}`;
    } catch (_) {}
  }

  _inLastSteps(i) {
    return i >= this._o.maxIterations - AgentRun.LAST_STEPS;
  }

  _aborting() {
    return typeof this._o.shouldAbort === 'function' && this._o.shouldAbort();
  }

  _emit(event) {
    if (typeof this._o.onEvent !== 'function') return;
    try { this._o.onEvent(event); } catch (_) {}
  }

  static _reasoningOf(message) {
    return typeof message.reasoning_content === 'string' ? message.reasoning_content.trim() : '';
  }
}

module.exports = AgentRun;
