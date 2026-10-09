const RecordId = require('../../core/database/RecordId');
const ResponseFormat = require('./ResponseFormat');
const TaskFields = require('./TaskFields');

class TimedTaskRunner {
  static MAX_ITERATIONS = 15;
  static RUN_TIMEOUT_MS = 300000;

  constructor({ repository, aiChat, webhook, broadcast, now = () => new Date() }) {
    this._repository = repository;
    this._aiChat = aiChat;
    this._webhook = webhook;
    this._broadcast = broadcast;
    this._now = now;
    this._running = new Set();
  }

  isRunning(taskId) {
    return this._running.has(taskId);
  }

  reset() {
    this._running.clear();
  }

  async execute(task, { silent = true } = {}) {
    if (this._running.has(task.id)) return { runId: null, response: 'Task is already running', status: 'skipped' };
    this._running.add(task.id);
    const run = { id: RecordId.create('run'), startedAt: this._now().toISOString() };
    try {
      this._startRun(task, run);
      return await this._runAgent(task, run, silent);
    } catch (error) {
      return this._recordCrash(task, run, error);
    } finally {
      this._finish(task);
    }
  }

  _startRun(task, run) {
    this._repository.insertRun({ id: run.id, task_id: task.id, request_prompt: task.request_prompt, status: 'running', started_at: run.startedAt });
    this._repository.update(task.id, { status: 'running', last_error: null });
    this._broadcast.emit('run-started', task.id);
  }

  async _runAgent(task, run, silent) {
    const systemPromptAppend = ResponseFormat.instructionFor(task.response_prompt);
    const agentResult = await this._aiChat.run({
      prompt: task.request_prompt,
      label: task.name,
      autoCloseTab: !!silent,
      maxIterations: TimedTaskRunner.MAX_ITERATIONS,
      timeout: TimedTaskRunner.RUN_TIMEOUT_MS,
      systemPromptAppend,
    });
    const finished = this._recordAgentResult(task, run, silent, systemPromptAppend, agentResult);
    const lastError = await this._deliver(task, run, finished) || agentResult.error || null;
    this._repository.recordOutcome(task.id, { lastRun: finished.completedAt, lastStatus: lastError ? 'error' : 'ok', lastError });
    return { runId: run.id, response: finished.finalResponse, status: lastError ? 'error' : finished.status, error: lastError };
  }

  _recordAgentResult(task, run, silent, systemPromptAppend, agentResult) {
    const finalResponse = agentResult.finalResponse || '';
    const status = agentResult.error ? 'error' : 'completed';
    const completedAt = this._now().toISOString();
    const log = TimedTaskRunner._runLog({ task, run, silent, systemPromptAppend, agentResult, finalResponse, status, completedAt });
    this._repository.finishRun(run.id, {
      response: agentResult.error || finalResponse, status, completedAt, error: agentResult.error || null, conversationLog: JSON.stringify(log),
    });
    return { finalResponse, status, completedAt };
  }

  async _deliver(task, run, finished) {
    if (!task.webhook_url || finished.status !== 'completed') return null;
    try {
      await this._webhook.send(task, { runId: run.id, finalResponse: finished.finalResponse, completedAt: finished.completedAt });
      this._repository.markWebhookSent(run.id);
      return null;
    } catch (webhookErr) {
      const error = `Webhook failed: ${webhookErr.message}`;
      console.error('timed-tasks: webhook failed:', webhookErr.message);
      this._repository.setRunError(run.id, error);
      return error;
    }
  }

  _recordCrash(task, run, error) {
    const completedAt = this._now().toISOString();
    const conversationLog = JSON.stringify({ runId: run.id, taskId: task.id, error: error.message, stack: error.stack, timestamp: completedAt });
    this._repository.finishRun(run.id, { response: error.message, status: 'error', completedAt, error: error.message, conversationLog });
    this._repository.recordOutcome(task.id, { lastRun: completedAt, lastStatus: 'error', lastError: error.message });
    return { runId: run.id, response: error.message, status: 'error', error: error.message };
  }

  _finish(task) {
    this._running.delete(task.id);
    const fresh = this._repository.get(task.id);
    if (fresh) {
      this._repository.update(task.id, { status: 'idle' });
      if (fresh.enabled) this._repository.update(task.id, { next_run: TaskFields.nextRun(fresh.repeat_interval) });
    }
    this._broadcast.emit('run-finished', task.id);
  }

  static _runLog({ task, run, silent, systemPromptAppend, agentResult, finalResponse, status, completedAt }) {
    return {
      runId: run.id,
      taskId: task.id,
      taskName: task.name,
      silent,
      startedAt: run.startedAt,
      completedAt,
      status,
      tabId: agentResult.tabId,
      iterations: agentResult.iterations,
      durationMs: agentResult.durationMs,
      toolCalls: agentResult.toolCalls || [],
      steps: agentResult.steps || [],
      systemPrompt: agentResult.systemPrompt || null,
      systemPromptAppend,
      summary: agentResult.summary || null,
      error: agentResult.error || null,
      finalResponse,
    };
  }
}

module.exports = TimedTaskRunner;
