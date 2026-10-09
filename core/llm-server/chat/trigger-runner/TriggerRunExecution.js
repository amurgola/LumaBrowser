const TriggerPayload = require('../triggers/TriggerPayload');
const TriggerApprovalPolicy = require('../trigger-store/TriggerApprovalPolicy');
const CapturedBridgeRun = require('../schedulers/CapturedBridgeRun');
const RunTranscript = require('../schedulers/RunTranscript');
const TriggerRunTools = require('./TriggerRunTools');
const TriggerRunPrompt = require('./TriggerRunPrompt');
const TriggerResultShape = require('./TriggerResultShape');
const TriggerRetryScheduler = require('./TriggerRetryScheduler');

class TriggerRunExecution {
  static RUN_TIMEOUT_MS = 5 * 60 * 1000;
  static APPROVAL_HOLD_MS = 30 * 60 * 1000;
  static KEEP_TRANSCRIPTS_KEY = 'core.triggers.keepTranscripts';

  constructor(services, trigger, event, { kind = 'event', dedupeKey = null, deliveryId = null, deliveryIds = [], attempt = 1, retryOf = null, source = 'webhook', resolvers = [] } = {}) {
    this._s = services;
    this._trigger = trigger;
    this._event = event;
    this._opts = { kind, dedupeKey, deliveryId, deliveryIds: deliveryIds || [], attempt, retryOf, source, resolvers };
    this._run = null;
    this._state = { responseBody: undefined, memorySaved: false, shapeError: null, attempt, previousError: null, memoryBlock: null };
  }

  async execute() {
    this._loadContext();
    try {
      return await this._runToCompletion();
    } catch (err) {
      return this._recordCrash(err);
    }
  }

  _loadContext() {
    this._state.memoryBlock = TriggerRunPrompt.memoryBlock(this._trigger, this._s.triggerStore);
    if (!this._opts.retryOf) return;
    try {
      const previous = this._s.triggerStore.getRun(this._opts.retryOf);
      this._state.previousError = previous && previous.error;
    } catch (_) {}
  }

  async _runToCompletion() {
    const { deps, chatStore, bridge } = this._s.runtime();
    const cfg = this._s.runConfig.resolve(this._trigger, deps);
    const transcript = RunTranscript.open(chatStore, { title: this._trigger.title, label: 'fire', modelRef: cfg.modelRef });
    this._startRun(transcript);
    const userMessage = TriggerPayload.buildUserMessage(this._trigger.action && this._trigger.action.prompt, this._event);
    transcript.addUser(userMessage);
    const result = await this._driveBridge(bridge, transcript, deps, cfg, userMessage);
    transcript.addAssistant(result, cfg.modelRef);
    const verdict = this._verdict(result);
    this._s.triggerStore.recordRunFinish(this._run.id, { status: verdict.status, error: verdict.errorText, response: result.finalResponse || null });
    const retryPending = this._afterRealFire(verdict.status, verdict.errorText);
    RunTranscript.prune(this._s.triggerStore, this._trigger.id, RunTranscript.keepCount(this._s.settingsDb, TriggerRunExecution.KEEP_TRANSCRIPTS_KEY), chatStore);
    this._emitFinished(verdict.status, retryPending);
    return { run: this._finishedRow(result), retryPending };
  }

  _startRun(transcript) {
    const { kind, dedupeKey, attempt, retryOf, deliveryId, deliveryIds } = this._opts;
    this._run = this._s.triggerStore.recordRunStart(this._trigger.id, { conversationId: transcript.conversationId, kind, event: this._event, dedupeKey, attempt, retryOf });
    this._state.run = this._run;
    if (deliveryId) {
      this._s.logger.log(this._trigger.id, null, { id: deliveryId, outcome: 'fired', detail: attempt > 1 ? `retry attempt ${attempt} started` : 'run started', runId: this._run.id });
    }
    for (const id of deliveryIds) {
      this._s.logger.log(this._trigger.id, null, { id, outcome: 'fired', detail: `batch run of ${this._event && this._event.count}`, runId: this._run.id });
    }
    this._s.emitEvent('run-started', { triggerId: this._trigger.id, runId: this._run.id, kind, title: this._trigger.title || null });
  }

  _driveBridge(bridge, transcript, deps, cfg, userMessage) {
    const capture = new CapturedBridgeRun({ timeoutMs: TriggerRunExecution.RUN_TIMEOUT_MS, onToolEvent: (ev) => this._onToolEvent(ev, control) });
    const control = {
      pause: () => { capture.pauseTimeout(); this._s.heldGate.release(); },
      resume: () => { capture.resumeTimeout(); this._s.heldGate.reacquire(() => !capture.settled); },
    };
    const extraTools = TriggerRunTools.build({ trigger: this._trigger, event: this._event, state: this._state, triggerStore: this._s.triggerStore, emitEvent: this._s.emitEvent });
    return capture.run(bridge, {
      modelRef: cfg.modelRef,
      messages: [{ role: 'user', content: userMessage }],
      temperature: 0.2,
      conversationId: transcript.conversationId,
      assistantMessageId: `trig-msg-${this._trigger.id}`,
      deps,
      priorMessages: [],
      images: [],
      allowedTools: TriggerRunTools.allowList(cfg.allowedTools, extraTools),
      extraTools,
      approvalOverride: TriggerApprovalPolicy.of(this._trigger).mode === 'ask' ? 'ask' : 'never',
      approvalTimeoutMs: TriggerRunExecution.APPROVAL_HOLD_MS,
      kbScope: cfg.kbScope || null,
      modeSystemPrompt: TriggerRunPrompt.system(this._trigger, this._opts.kind, this._event, cfg, this._state),
    });
  }

  _onToolEvent(ev, control) {
    const runId = this._run ? this._run.id : null;
    if (ev.phase === 'approval') this._s.approvalHold.onRequest(this._trigger, runId, ev, control);
    else if (ev.phase === 'approval-done') this._s.approvalHold.onDone(this._trigger, runId, ev, control);
  }

  _verdict(result) {
    let status = result.error ? 'error' : 'ok';
    let errorText = RunTranscript.errorText(result.error);
    const expect = this._trigger.action && this._trigger.action.expect;
    if (!errorText && expect) {
      const shapeError = TriggerResultShape.error(expect, TriggerResultShape.resultJson(this._state.responseBody, result.finalResponse));
      if (shapeError) {
        status = 'error';
        errorText = shapeError;
        this._state.shapeError = shapeError;
      }
    }
    return { status, errorText };
  }

  _afterRealFire(status, errorText) {
    if (this._opts.kind !== 'event') return false;
    let retryPending = false;
    if (status === 'error' && TriggerRetryScheduler.retryable(errorText, this._state.shapeError)) {
      retryPending = this._scheduleRetry(errorText);
    }
    if (!retryPending) this._s.failureNotifier.afterFire(this._trigger, status, errorText);
    return retryPending;
  }

  _scheduleRetry(errorText) {
    const { attempt, dedupeKey, source, resolvers } = this._opts;
    const delay = this._s.retries.schedule(this._trigger, this._event, { attempt, runId: this._run ? this._run.id : null, dedupeKey, source, resolvers, errorText });
    return delay != null;
  }

  _finishedRow(result) {
    const out = this._s.triggerStore.getRun(this._run.id);
    if (this._state.responseBody !== undefined) out.responseBody = this._state.responseBody;
    if (this._state.shapeError) out.shapeError = this._state.shapeError;
    out.toolTrace = result.toolTrace || [];
    return out;
  }

  _recordCrash(err) {
    const message = (err && err.message) || String(err);
    if (this._run) this._s.triggerStore.recordRunFinish(this._run.id, { status: 'error', error: message });
    if (this._opts.deliveryId && !this._run) {
      this._s.logger.log(this._trigger.id, null, { id: this._opts.deliveryId, outcome: 'error', detail: message });
    }
    let retryPending = false;
    if (this._opts.kind === 'event') {
      retryPending = this._scheduleRetry(message);
      if (!retryPending) this._s.failureNotifier.afterFire(this._trigger, 'error', message);
    }
    this._emitFinished('error', retryPending);
    return { run: this._run ? this._s.triggerStore.getRun(this._run.id) : null, retryPending };
  }

  _emitFinished(status, retryPending) {
    this._s.emitEvent('run-finished', {
      triggerId: this._trigger.id, runId: this._run ? this._run.id : null, kind: this._opts.kind, status, title: this._trigger.title || null, retryPending,
    });
  }
}

module.exports = TriggerRunExecution;
