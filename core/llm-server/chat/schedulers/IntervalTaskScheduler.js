const AgentChatBridge = require('../AgentChatBridge');
const BackgroundRunGate = require('../BackgroundRunGate');
const CapturedBridgeRun = require('./CapturedBridgeRun');
const RunTranscript = require('./RunTranscript');

class IntervalTaskScheduler {
  static TICK_MS = 30 * 1000;
  static DEFER_MS = 2 * 60 * 1000;
  static RUN_TIMEOUT_MS = 5 * 60 * 1000;

  static GATE_OWNER = null;
  static KEEP_TRANSCRIPTS_KEY = null;
  static MESSAGE_ID_PREFIX = null;
  static CATCH_UP_DELAY_MS = null;
  static DISABLED_ERROR = null;
  static OUTCOME_FIELD = null;

  static REQUIRED_DECLARATIONS = ['GATE_OWNER', 'KEEP_TRANSCRIPTS_KEY', 'MESSAGE_ID_PREFIX', 'CATCH_UP_DELAY_MS',
    'DISABLED_ERROR', 'OUTCOME_FIELD'];

  constructor({ taskStore, settingsDb = null, getAgentDeps, getRouter, emitEvent, gate = null, bridgeFactory = null, now = null } = {}) {
    this._assertDeclared();
    if (!taskStore) throw new Error(`${this.constructor.name} requires a taskStore`);
    this.taskStore = taskStore;
    this.settingsDb = settingsDb;
    this._getAgentDeps = typeof getAgentDeps === 'function' ? getAgentDeps : () => null;
    this._getRouter = typeof getRouter === 'function' ? getRouter : () => null;
    this._emitEvent = typeof emitEvent === 'function' ? emitEvent : () => {};
    this._gate = gate || new BackgroundRunGate();
    this._bridgeFactory = typeof bridgeFactory === 'function' ? bridgeFactory : (router) => new AgentChatBridge({ router });
    this._now = typeof now === 'function' ? now : () => Date.now();
    this._timer = null;
    this._running = false;
    this._deferUntil = 0;
    this._bridge = null;
  }

  start() {
    if (this._timer) return;
    this._timer = setInterval(() => { this.tick().catch(() => {}); }, IntervalTaskScheduler.TICK_MS);
    if (this._timer.unref) this._timer.unref();
    const catchUp = setTimeout(() => { this.tick().catch(() => {}); }, this.constructor.CATCH_UP_DELAY_MS);
    if (catchUp.unref) catchUp.unref();
  }

  stop() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  }

  async tick() {
    if (this._busy()) return null;
    if (this._now() < this._deferUntil) return null;
    const due = this.taskStore.due(new Date().toISOString());
    if (!due.length) return null;
    if (this._chatStreaming()) {
      this._deferUntil = this._now() + IntervalTaskScheduler.DEFER_MS;
      return null;
    }
    return this._runTask(due[0], 'scheduled');
  }

  async runNow(taskId) {
    const task = this.taskStore.get(taskId);
    if (!task) return { success: false, error: 'task not found' };
    if (!task.enabled) return { success: false, error: this.constructor.DISABLED_ERROR };
    if (this._busy()) return { success: false, error: 'another scheduled run is in progress' };
    if (this._chatStreaming()) return { success: false, error: 'a chat is streaming; try again shortly' };
    return IntervalTaskScheduler._started(await this._runTask(task, 'manual'));
  }

  _runConfig(_task, _deps) {
    throw new Error(`${this.constructor.name} must implement _runConfig()`);
  }

  _buildRunPreamble(_task, _kind) {
    throw new Error(`${this.constructor.name} must implement _buildRunPreamble()`);
  }

  _runExtras(_kind) {
    return {};
  }

  _eventExtras(_task, _kind) {
    return {};
  }

  _busy() {
    return this._running || this._gate.busy;
  }

  _chatStreaming() {
    const router = this._getRouter();
    return !!(router && router.active);
  }

  async _runTask(task, kind) {
    if (this._running) return null;
    const gateToken = this._gate.tryAcquire(this.constructor.GATE_OWNER);
    if (!gateToken) return null;
    this._running = true;
    const attempt = { run: null };
    try {
      return await this._executeRun(task, kind, attempt);
    } catch (err) {
      return this._recordCrash(task, kind, attempt.run, err);
    } finally {
      this._running = false;
      this._gate.release(gateToken);
    }
  }

  async _executeRun(task, kind, attempt) {
    const { deps, chatStore } = this._runtime();
    const cfg = this._runConfig(task, deps);
    const transcript = RunTranscript.open(chatStore, { title: task.title, label: 'run', modelRef: cfg.modelRef });
    attempt.run = this.taskStore.recordRunStart(task.id, { conversationId: transcript.conversationId, ...this._runExtras(kind) });
    this._emit('run-started', task, kind, { runId: attempt.run.id });
    transcript.addUser(task.prompt);
    const result = await this._driveBridge(task, transcript, deps, cfg, kind);
    transcript.addAssistant(result, cfg.modelRef);
    return this._recordFinish(task, kind, attempt.run, result, chatStore);
  }

  _runtime() {
    const router = this._getRouter();
    const deps = this._getAgentDeps();
    const chatStore = router && router.chatStore;
    if (!router || !deps || !chatStore) throw new Error('agent runtime is not ready');
    if (!this._bridge) this._bridge = this._bridgeFactory(router);
    return { router, deps, chatStore };
  }

  _driveBridge(task, transcript, deps, cfg, kind) {
    const capture = new CapturedBridgeRun({ timeoutMs: IntervalTaskScheduler.RUN_TIMEOUT_MS });
    return capture.run(this._bridge, {
      modelRef: cfg.modelRef,
      messages: [{ role: 'user', content: task.prompt }],
      temperature: 0.2,
      conversationId: transcript.conversationId,
      assistantMessageId: `${this.constructor.MESSAGE_ID_PREFIX}-${task.id}`,
      deps,
      priorMessages: [],
      images: [],
      allowedTools: cfg.allowedTools,
      modeSystemPrompt: this._buildRunPreamble(task, kind),
    });
  }

  _recordFinish(task, kind, run, result, chatStore) {
    const status = result.error ? 'error' : 'ok';
    this.taskStore.recordRunFinish(run.id, {
      status,
      error: RunTranscript.errorText(result.error),
      [this.constructor.OUTCOME_FIELD]: result.finalResponse || null,
    });
    this.taskStore.recordCompletion(task.id, { status });
    RunTranscript.prune(this.taskStore, task.id, RunTranscript.keepCount(this.settingsDb, this.constructor.KEEP_TRANSCRIPTS_KEY), chatStore);
    this._emit('run-finished', task, kind, { runId: run.id, status });
    return this.taskStore.getRun(run.id);
  }

  _recordCrash(task, kind, run, err) {
    const message = (err && err.message) || String(err);
    if (run) this.taskStore.recordRunFinish(run.id, { status: 'error', error: message });
    this.taskStore.recordCompletion(task.id, { status: 'error' });
    this._emit('run-finished', task, kind, { runId: run && run.id, status: 'error' });
    return run ? this.taskStore.getRun(run.id) : null;
  }

  _emit(type, task, kind, fields) {
    this._emitEvent(type, { taskId: task.id, ...fields, ...this._eventExtras(task, kind), title: task.title || null });
  }

  static _started(run) {
    return run ? { success: true, run } : { success: false, error: 'run failed to start' };
  }

  _assertDeclared() {
    for (const name of IntervalTaskScheduler.REQUIRED_DECLARATIONS) {
      if (this.constructor[name] == null) throw new Error(`${this.constructor.name} must declare ${name}`);
    }
  }
}

module.exports = IntervalTaskScheduler;
