const path = require('path');
const GoldenSet = require('../eval/GoldenSet');
const Scorer = require('../eval/Scorer');
const ExecutionCheck = require('./ExecutionCheck');
const GambitReport = require('./GambitReport');
const GambitCapabilities = require('./GambitCapabilities');
const GambitConversation = require('./GambitConversation');

class GambitRunner {
  static SUITE_DIR = path.join(__dirname, 'suite');
  static TURN_TIMEOUT_MS = 5 * 60 * 1000;
  static WEB_TARGET = GambitCapabilities.WEB_TARGET;

  static loadSuite(dir = GambitRunner.SUITE_DIR) {
    return GoldenSet.loadGoldenTasks(dir);
  }

  static runGambit(options) {
    return new GambitRunner(options).run();
  }

  constructor({ runTurn, tasks = null, capabilities = null, onProgress, isAborted, meta = {}, detectCapabilities = GambitCapabilities.detect } = {}) {
    if (typeof runTurn !== 'function') throw new Error('runGambit: runTurn function is required');
    this._runTurn = runTurn;
    this._tasks = tasks;
    this._capabilities = capabilities;
    this._onProgress = onProgress;
    this._isAbortedFn = isAborted;
    this._meta = meta;
    this._detectCapabilities = detectCapabilities;
  }

  async run() {
    await this._setupRun();
    for (const task of this._suite) {
      if (this._isAborted()) return this._finish(true);
      if (this._skipIfUnsupported(task)) continue;
      if (await this._runTask(task)) return this._finish(true);
    }
    return this._finish(false);
  }

  async _setupRun() {
    this._suite = this._tasks || GambitRunner.loadSuite();
    const detected = this._capabilities || await this._detectCapabilities();
    this._caps = detected.caps || detected;
    this._capReasons = detected.reasons || {};
    this._results = [];
    this._skipped = [];
    this._raw = [];
    this._done = 0;
  }

  _skipIfUnsupported(task) {
    const needs = Array.isArray(task.requires) ? task.requires : [];
    const missing = needs.filter((capability) => !this._caps[capability]);
    if (!missing.length) return false;
    const reason = this._capReasons[missing[0]] || `${missing.join(', ')} unavailable`;
    this._skipped.push({ taskId: task.id, group: task.group || task.category, reason });
    this._done += 1;
    this._emit({ phase: 'skip', ...this._progress(), taskId: task.id, group: task.group, reason });
    return true;
  }

  async _runTask(task) {
    const conversation = this._conversationFor(task);
    this._emit({ phase: 'task', ...this._progress(), taskId: task.id, group: task.group, turns: conversation.turns.length });
    const { transcripts, aborted } = await conversation.play();
    if (aborted) return true;
    await GambitRunner._attachExecution(task, transcripts);
    this._record(task, conversation.turns, transcripts);
    return false;
  }

  _conversationFor(task) {
    return new GambitConversation({
      task,
      runTurn: this._runTurn,
      emit: (payload) => this._emit(payload),
      isAborted: () => this._isAborted(),
      progress: this._progress(),
      turnTimeoutMs: GambitRunner.TURN_TIMEOUT_MS,
    });
  }

  static async _attachExecution(task, transcripts) {
    if (!task.execute) return;
    const execution = await ExecutionCheck.runExecutionCheck(task, transcripts);
    const last = transcripts[transcripts.length - 1];
    if (last) last.execution = execution;
    else transcripts.push({ execution, toolCalls: [], finalResponse: '' });
  }

  _record(task, turns, transcripts) {
    const scored = Scorer.scoreTask(task, transcripts);
    this._results.push(scored);
    this._raw.push({ taskId: task.id, group: scored.group, prompts: turns.map((turn) => turn.prompt), transcripts, scored });
    this._done += 1;
    this._emit({ phase: 'result', ...this._progress(), taskId: task.id, group: scored.group, score: scored.score, passed: scored.passed });
  }

  _finish(aborted) {
    const report = GambitReport.build({
      results: this._results,
      skipped: this._skipped,
      meta: { ...this._meta, webTarget: GambitRunner.WEB_TARGET },
    });
    report.aborted = aborted;
    report.raw = this._raw;
    return report;
  }

  _progress() {
    return { done: this._done, total: this._suite.length };
  }

  _isAborted() {
    return !!(this._isAbortedFn && this._isAbortedFn());
  }

  _emit(payload) {
    if (!this._onProgress) return;
    try {
      this._onProgress(payload);
    } catch (_) {}
  }
}

module.exports = GambitRunner;
