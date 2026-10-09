const ToolConcurrency = require('../../llm-service/ToolConcurrency');
const ToolPresentation = require('../chat/ToolPresentation');
const AgentLoopText = require('./AgentLoopText');
const WorkTab = require('./WorkTab');

class ToolBatchRunner {
  constructor(options) {
    this._o = options;
  }

  async run(iteration, batch, content, carriedNotes) {
    this._beginBatch(iteration, batch, content, carriedNotes);
    for (const call of batch) {
      if (this._aborting()) { this._aborted = true; break; }
      await this._admit(call);
    }
    await this._commitPending();
    this._reportDeferred();
    return { aborted: this._aborted };
  }

  _beginBatch(iteration, batch, content, carriedNotes) {
    this._iteration = iteration;
    this._batchSize = batch.length;
    this._content = content;
    this._notes = carriedNotes;
    this._pending = [];
    this._deferred = [];
    this._stateChanged = false;
    this._aborted = false;
  }

  _aborting() {
    return typeof this._o.shouldAbort === 'function' && this._o.shouldAbort();
  }

  async _admit(call) {
    const mode = ToolConcurrency.executionMode(call.tool, call.params);
    const exclusive = mode === ToolConcurrency.EXCLUSIVE;
    if (this._stateChanged && exclusive) { this._deferred.push(call); return; }
    if (exclusive || this._runningCount() >= this._o.maxParallel) await this._commitPending();
    const rejection = this._o.guard.check(call);
    if (rejection) { this._pending.push({ type: 'reject', ...rejection }); return; }
    await this._start(call);
    if (exclusive) { await this._commitPending(); this._stateChanged = true; }
  }

  async _start(call) {
    this._o.emit({ type: 'tool', tool: call.tool, params: call.params, iteration: this._iteration });
    const tabId = await this._tabFor(call);
    this._pending.push({
      type: 'run',
      call,
      startedAt: Date.now(),
      promise: this._o.executor.execute(call.tool, call.params, tabId)
        .catch((err) => ({ success: false, error: (err && err.message) || String(err) })),
    });
  }

  async _tabFor(call) {
    const workTab = this._o.workTab;
    if (workTab.lazy && !this._o.noBrowser && WorkTab.needsWorkTab(call.tool, call.params)) return workTab.ensure();
    return workTab.id;
  }

  _runningCount() {
    return this._pending.reduce((n, entry) => n + (entry.type === 'run' ? 1 : 0), 0);
  }

  async _commitPending() {
    while (this._pending.length) {
      const entry = this._pending.shift();
      if (entry.type === 'reject') this._o.history.pushToolResult(entry.text, this._takeNotes(), entry.tool || undefined);
      else await this._commitRun(entry);
    }
  }

  async _commitRun(entry) {
    const { call } = entry;
    const result = await entry.promise;
    const durationMs = Date.now() - entry.startedAt;
    this._o.clock.extend(durationMs);
    this._o.verifier.observe(call.tool, result);
    const outcome = ToolBatchRunner._outcome(result);
    this._o.toolCalls.push({ tool: call.tool, params: call.params, durationMs, success: outcome.success, error: outcome.error });
    this._o.emit(this._resultEvent(call, result, outcome));
    this._recordStep(call, result, durationMs, outcome);
    const text = this._o.compactor.compact(call.tool, result, this._o.toolResultBudget);
    this._o.history.pushToolResult(AgentLoopText.toolResult(call.tool, text), this._takeNotes(), call.tool, call.params);
    if (result && result.imageBase64) this._o.history.markScreenshot();
  }

  _resultEvent(call, result, outcome) {
    return {
      type: 'tool-result',
      tool: call.tool,
      iteration: this._iteration,
      success: outcome.success,
      error: outcome.error,
      summary: (result && result.summary) || null,
      artifact: (result && result.artifact) || null,
      meta: ToolPresentation.present(call.tool, call.params, result),
      image: (result && result.imageBase64) ? { base64: result.imageBase64, mime: result.mimeType || 'image/png' } : null,
    };
  }

  _recordStep(call, result, durationMs, outcome) {
    this._o.steps.push({
      iteration: this._iteration,
      assistantContent: this._content,
      toolCall: { tool: call.tool, params: call.params },
      toolResult: result,
      toolDurationMs: durationMs,
      toolSuccess: outcome.success,
      toolError: outcome.error,
      ...(this._batchSize > 1 ? { batchSize: this._batchSize } : {}),
    });
  }

  _reportDeferred() {
    for (const call of this._deferred) {
      this._o.history.pushToolResult(AgentLoopText.toolResult(call.tool, AgentLoopText.DEFERRED_CALL), this._takeNotes(), call.tool);
    }
  }

  _takeNotes() {
    const notes = this._notes;
    this._notes = '';
    return notes;
  }

  static _outcome(result) {
    const success = result?.success !== false;
    const error = result?.success === false ? (result.error || 'Tool reported failure') : null;
    return { success, error };
  }
}

module.exports = ToolBatchRunner;
