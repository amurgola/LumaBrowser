const AgentChatBridge = require('./AgentChatBridge');
const BackgroundRunGate = require('./BackgroundRunGate');
const QuietHours = require('./triggers/QuietHours');
const SetupChatToolPolicy = require('./schedulers/SetupChatToolPolicy');
const TriggerDeliveryLogger = require('./trigger-runner/TriggerDeliveryLogger');
const TriggerRunQueue = require('./trigger-runner/TriggerRunQueue');
const TriggerAdmission = require('./trigger-runner/TriggerAdmission');
const TriggerDriftCheck = require('./trigger-runner/TriggerDriftCheck');
const TriggerBatchWindows = require('./trigger-runner/TriggerBatchWindows');
const QuietHoursHold = require('./trigger-runner/QuietHoursHold');
const TriggerRetryScheduler = require('./trigger-runner/TriggerRetryScheduler');
const TriggerApprovalHold = require('./trigger-runner/TriggerApprovalHold');
const TriggerFailureNotifier = require('./trigger-runner/TriggerFailureNotifier');
const TriggerRunConfig = require('./trigger-runner/TriggerRunConfig');
const TriggerRunExecution = require('./trigger-runner/TriggerRunExecution');
const TriggerSampleEvent = require('./trigger-runner/TriggerSampleEvent');
const HeldGate = require('./trigger-runner/HeldGate');

class TriggerRunner {
  static DEFER_MS = 15 * 1000;
  static RUN_TIMEOUT_MS = TriggerRunExecution.RUN_TIMEOUT_MS;
  static QUEUE_DEPTH = TriggerRunQueue.DEPTH;
  static APPROVAL_HOLD_MS = TriggerRunExecution.APPROVAL_HOLD_MS;
  static GATE_OWNER = 'triggers';

  constructor({ triggerStore, settingsDb = null, getAgentDeps, getRouter, emitEvent, gate = null, pageSource = null, notify = null, getAgentManager = null, bridgeFactory = null } = {}) {
    if (!triggerStore) throw new Error('TriggerRunner requires a triggerStore');
    this.triggerStore = triggerStore;
    this.settingsDb = settingsDb;
    this.pageSource = pageSource;
    this._getAgentDeps = typeof getAgentDeps === 'function' ? getAgentDeps : () => null;
    this._getRouter = typeof getRouter === 'function' ? getRouter : () => null;
    this._emitEvent = typeof emitEvent === 'function' ? emitEvent : () => {};
    this._notify = typeof notify === 'function' ? notify : null;
    this._gate = gate || new BackgroundRunGate();
    this._bridgeFactory = typeof bridgeFactory === 'function' ? bridgeFactory : (router) => new AgentChatBridge({ router });
    this._bridge = null;
    this._running = false;
    this._stopped = false;
    this._deferTimer = null;
    this._buildParts(typeof getAgentManager === 'function' ? getAgentManager : () => null);
  }

  stop() {
    this._stopped = true;
    if (this._deferTimer) { clearTimeout(this._deferTimer); this._deferTimer = null; }
    this._quietHold.dropAll();
    this._retries.dropAll();
    this._batches.dropAll();
    this._dropQueued();
  }

  fire(triggerId, event, { kind = 'event', dedupeKey = null, source = 'webhook', remote = null } = {}) {
    const trigger = this.triggerStore.get(triggerId);
    if (!trigger) return TriggerRunner._refused('trigger not found');
    const log = (outcome, detail) => this._logger.log(triggerId, event, { outcome, detail, dedupeKey, source, remote });
    const early = this._earlyRefusal(trigger, kind, dedupeKey);
    if (early) {
      log(early.outcome, early.detail);
      return TriggerRunner._refused(early.reason);
    }
    if (kind !== 'event') return this._enqueue(trigger, event, { kind, dedupeKey, source, remote });
    return this._fireEvent(trigger, event, { dedupeKey, source, remote, log });
  }

  deliver(triggerId, event, { dedupeKey = null, source = null } = {}) {
    const trigger = this.triggerStore.get(triggerId);
    if (!trigger) return { accepted: false, reason: 'trigger not found' };
    const from = source || trigger.kind;
    if (!trigger.sample) {
      this._captureSample(trigger, event, { detail: 'stored as the sample', dedupeKey, source: from });
      return { accepted: true, captured: true };
    }
    if (!trigger.enabled) {
      this._logger.log(triggerId, event, { outcome: 'unarmed', detail: 'trigger not armed', dedupeKey, source: from });
      return { accepted: false, reason: 'trigger not armed' };
    }
    return this.fire(triggerId, event, { kind: 'event', dedupeKey, source: from });
  }

  async runInline(triggerId, { kind = 'test', event = undefined } = {}) {
    const trigger = this.triggerStore.get(triggerId);
    if (!trigger) return { success: false, error: 'trigger not found' };
    const ev = event !== undefined ? event : trigger.sample;
    if (ev == null) return { success: false, error: 'no sample event yet; capture or set one first' };
    if (this._running) return { success: false, error: 'another trigger run is in progress' };
    if (this._gate.busy) return { success: false, error: `another background run (${this._gate.owner}) is in progress; try again shortly` };
    const outcome = await this._runTrigger(trigger, ev, { kind });
    if (!outcome || !outcome.run) return { success: false, error: 'run failed to start' };
    if (kind === 'test') this._recordTest(triggerId, outcome.run);
    const out = { success: true, run: outcome.run };
    const gating = TriggerAdmission.report(trigger, ev);
    if (gating) out.gating = gating;
    return out;
  }

  async simulate(triggerId, body) {
    const trigger = this.triggerStore.get(triggerId);
    if (!trigger) return { success: false, error: 'trigger not found' };
    let event;
    try { event = await this.eventFor(trigger, body); } catch (err) { return { success: false, error: err.message }; }
    if (!trigger.sample) {
      const next = this._captureSample(trigger, event, { detail: 'stored as the sample (typed)', source: 'simulate' });
      return { success: true, captured: true, trigger: next };
    }
    const kind = trigger.enabled ? 'manual' : 'test';
    const res = await this.runInline(triggerId, { kind, event });
    this._logSimulated(triggerId, event, kind, res);
    if (res.success) res.trigger = this.triggerStore.get(triggerId);
    return res;
  }

  async replay(runId) {
    const past = this.triggerStore.getRun(runId);
    if (!past) return { success: false, error: 'run not found' };
    if (past.event == null) return { success: false, error: 'that run has no stored event' };
    return this.runInline(past.triggerId, { kind: 'replay', event: past.event });
  }

  eventFor(trigger, body) {
    return TriggerSampleEvent.for(trigger, body, this.pageSource);
  }

  gatingReport(trigger, event) {
    return TriggerAdmission.report(trigger, event);
  }

  describeRunTools(conversationId) {
    return this._toolPolicy.describe(conversationId, this._getAgentDeps());
  }

  queueDepth(triggerId) {
    return this._queue.depth(triggerId);
  }

  batchDepth(triggerId) {
    return this._batches.depth(triggerId);
  }

  deferredStatus(triggerId) {
    return this._quietHold.status(triggerId);
  }

  pendingRetry(triggerId) {
    return this._retries.pending(triggerId);
  }

  pendingApproval(triggerId) {
    return this._approvals.pending(triggerId);
  }

  approve(runId, decision) {
    return this._approvals.approve(runId, decision);
  }

  static backoffMs(base, attempt) {
    return TriggerRetryScheduler.backoffMs(base, attempt);
  }

  static retryable(errorText, state) {
    return TriggerRetryScheduler.retryable(errorText, state && state.shapeError);
  }

  _buildParts(getAgentManager) {
    const emitEvent = (type, payload) => this._emitEvent(type, payload);
    const triggerStore = this.triggerStore;
    this._logger = new TriggerDeliveryLogger({ triggerStore, emitEvent });
    this._queue = new TriggerRunQueue({ logger: this._logger, emitEvent });
    this._admission = new TriggerAdmission();
    this._drift = new TriggerDriftCheck({ triggerStore, emitEvent, notify: this._notify });
    const pending = { triggerStore, logger: this._logger, emitEvent, enqueue: (t, e, o) => this._enqueue(t, e, o), isStopped: () => this._stopped };
    this._batches = new TriggerBatchWindows(pending);
    this._quietHold = new QuietHoursHold(pending);
    this._retries = new TriggerRetryScheduler(pending);
    this._approvals = new TriggerApprovalHold({ triggerStore, emitEvent, notify: this._notify, getBridge: () => this._bridge });
    this._failures = new TriggerFailureNotifier({ triggerStore, emitEvent, notify: this._notify });
    this._toolPolicy = new SetupChatToolPolicy({ settingsDb: this.settingsDb, getRouter: this._getRouter });
    this._runConfig = new TriggerRunConfig({ toolPolicy: this._toolPolicy, getAgentManager });
  }

  _earlyRefusal(trigger, kind, dedupeKey) {
    if (!trigger.enabled && kind === 'event') return { outcome: 'unarmed', detail: 'trigger not armed', reason: 'trigger not armed' };
    if (dedupeKey && this.triggerStore.hasRunForDedupeKey(trigger.id, dedupeKey)) {
      return { outcome: 'duplicate', detail: `already ran for ${dedupeKey}`, reason: 'duplicate delivery' };
    }
    if (this._stopped) return { outcome: 'dropped', detail: 'runner stopped', reason: 'runner stopped' };
    return null;
  }

  _fireEvent(trigger, event, { dedupeKey, source, remote, log }) {
    const refusal = this._admission.refusal(trigger, event);
    if (refusal) {
      log(refusal.outcome, refusal.detail);
      return { ...refusal.reply, done: Promise.resolve(null) };
    }
    this._admission.markAccepted(trigger.id);
    const quiet = this._quietHoursReply(trigger, event, { dedupeKey, source, remote, log });
    if (quiet) return quiet;
    const driftNote = this._drift.note(trigger, event);
    if (trigger.source && trigger.source.batch) return this._batchReply(trigger, event, { dedupeKey, driftNote, log });
    const res = this._enqueue(trigger, event, { kind: 'event', dedupeKey, source, remote, detail: driftNote ? `queued; ${driftNote}` : null });
    if (driftNote) res.drift = driftNote;
    return res;
  }

  _quietHoursReply(trigger, event, { dedupeKey, source, remote, log }) {
    const config = trigger.source && trigger.source.quietHours;
    if (!config) return null;
    const q = QuietHours.check(config);
    if (!q.quiet) return null;
    const until = q.resumesAt.toISOString();
    if (config.mode === 'skip') {
      log('quiet', `skipped: quiet hours until ${until}`);
      return { accepted: false, reason: 'quiet_hours', resumesAt: until, done: Promise.resolve(null) };
    }
    const deliveryId = log('deferred', `held for quiet hours until ${until}`);
    const done = this._quietHold.add(trigger, event, { dedupeKey, source, remote, resumesAt: q.resumesAt, deliveryId });
    return { accepted: true, reason: null, deferred: true, resumesAt: until, done, deliveryId };
  }

  _batchReply(trigger, event, { dedupeKey, driftNote, log }) {
    const deliveryId = log('batched', driftNote ? `collecting; ${driftNote}` : 'collecting');
    const done = this._batches.add(trigger, event, { deliveryId, dedupeKey });
    return { accepted: true, reason: null, batched: true, batchSize: this.batchDepth(trigger.id), done, deliveryId, drift: driftNote || undefined };
  }

  _enqueue(trigger, event, { kind, dedupeKey, deliveryIds = [], detail = null, source = 'webhook', remote = null, deliveryId = null, attempt = 1, retryOf = null, resolvers = null }) {
    let resolve;
    const done = new Promise((r) => { resolve = r; });
    const ahead = this._queue.depth(trigger.id);
    this._queue.makeRoom(trigger);
    const ownId = deliveryId || (deliveryIds.length ? null
      : this._logger.log(trigger.id, event, { outcome: 'queued', detail: detail || `position ${ahead + 1}`, dedupeKey, source, remote }));
    this._queue.push({ triggerId: trigger.id, event, kind, dedupeKey, resolve, deliveryId: ownId, deliveryIds, attempt, retryOf, source, resolvers: Array.isArray(resolvers) ? resolvers : [] });
    this._emitEvent('queued', { triggerId: trigger.id, depth: this.queueDepth(trigger.id), title: trigger.title || null });
    this._drain();
    return { accepted: true, reason: null, done, deliveryId: ownId };
  }

  _drain() {
    if (this._stopped || this._running || !this._queue.length) return;
    if (!this._readyToRun()) {
      this._deferDrain();
      return;
    }
    const next = this._queue.shift();
    const trigger = this.triggerStore.get(next.triggerId);
    if (!trigger) {
      this._logger.log(next.triggerId, null, { id: next.deliveryId, outcome: 'dropped', detail: 'trigger deleted while queued' });
      next.resolve(null);
      this._drain();
      return;
    }
    this._runQueued(trigger, next);
  }

  _readyToRun() {
    const router = this._getRouter();
    const deps = this._getAgentDeps();
    return !!(router && deps && !router.active && !this._gate.busy);
  }

  _deferDrain() {
    if (this._deferTimer) return;
    this._deferTimer = setTimeout(() => { this._deferTimer = null; this._drain(); }, TriggerRunner.DEFER_MS);
    if (this._deferTimer.unref) this._deferTimer.unref();
  }

  _runQueued(trigger, next) {
    const waiters = [next.resolve, ...next.resolvers];
    const settle = (run) => { for (const resolve of waiters) resolve(run); };
    this._runTrigger(trigger, next.event, {
      kind: next.kind, dedupeKey: next.dedupeKey, deliveryId: next.deliveryId, deliveryIds: next.deliveryIds,
      attempt: next.attempt, retryOf: next.retryOf, source: next.source, resolvers: waiters,
    })
      .then((outcome) => { if (!(outcome && outcome.retryPending)) settle(outcome ? outcome.run : null); }, () => settle(null))
      .finally(() => this._drain());
  }

  async _runTrigger(trigger, event, options) {
    if (this._running) return null;
    const heldGate = new HeldGate(this._gate, TriggerRunner.GATE_OWNER);
    if (!heldGate.acquire()) return null;
    this._running = true;
    try {
      return await new TriggerRunExecution(this._executionServices(heldGate), trigger, event, options).execute();
    } finally {
      this._running = false;
      this._approvals.clearFor(trigger.id);
      heldGate.close();
    }
  }

  _executionServices(heldGate) {
    return {
      triggerStore: this.triggerStore,
      settingsDb: this.settingsDb,
      runtime: () => this._runtime(),
      heldGate,
      logger: this._logger,
      emitEvent: (type, payload) => this._emitEvent(type, payload),
      runConfig: this._runConfig,
      approvalHold: this._approvals,
      retries: this._retries,
      failureNotifier: this._failures,
    };
  }

  _runtime() {
    const router = this._getRouter();
    const deps = this._getAgentDeps();
    const chatStore = router && router.chatStore;
    if (!router || !deps || !chatStore) throw new Error('agent runtime is not ready');
    if (!this._bridge) this._bridge = this._bridgeFactory(router);
    return { deps, chatStore, bridge: this._bridge };
  }

  _captureSample(trigger, event, { detail, dedupeKey = null, source }) {
    const next = this.triggerStore.setSample(trigger.id, event);
    this._logger.log(trigger.id, event, { outcome: 'captured', detail, dedupeKey, source });
    this._emitEvent('sample-captured', { triggerId: trigger.id, title: trigger.title || null });
    this._emitEvent('triggers-changed', { triggerId: trigger.id });
    return next;
  }

  _recordTest(triggerId, run) {
    this.triggerStore.recordTest(triggerId, { ok: run.status === 'ok', runId: run.id, error: run.error || null });
    this._emitEvent('triggers-changed', { triggerId });
  }

  _logSimulated(triggerId, event, kind, res) {
    this._logger.log(triggerId, event, {
      outcome: res.success ? 'fired' : 'error',
      source: 'simulate',
      detail: res.success ? `${kind} run` : (res.error || 'could not run'),
      runId: res.success && res.run ? res.run.id : null,
    });
  }

  _dropQueued() {
    for (const item of this._queue.takeAll()) {
      this._logger.log(item.triggerId, null, { outcome: 'dropped', detail: 'app shutting down', id: item.deliveryId });
      item.resolve(null);
      for (const id of item.deliveryIds || []) this._logger.log(item.triggerId, null, { id, outcome: 'dropped', detail: 'app shutting down' });
    }
  }

  static _refused(reason) {
    return { accepted: false, reason, done: Promise.resolve(null) };
  }
}

module.exports = TriggerRunner;
