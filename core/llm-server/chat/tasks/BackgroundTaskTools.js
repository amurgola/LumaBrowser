const BackgroundTaskRules = require('./BackgroundTaskRules');
const BackgroundTasks = require('./BackgroundTasks');
const BackgroundTaskText = require('./BackgroundTaskText');
const TerminalRunFollow = require('./TerminalRunFollow');
const ConversationJobReminder = require('../jobs/ConversationJobReminder');
const ConversationJobs = require('../jobs/ConversationJobs');

class BackgroundTaskTools {
  static RUN = 'run_in_background';
  static STATUS = 'background_task_status';
  static STOP = 'stop_background_task';
  static TITLE_MAX = 80;
  static TITLE_KEYS = ['command', 'prompt', 'query', 'title', 'name'];

  static NOT_HERE = 'Background tasks are not available in this run. Call the tool directly.';
  static NO_TASKS = 'There are no background tasks in this conversation.';
  static NOTHING_TO_DO = 'Nothing for you to do until they end: their results are sent to you automatically. Answer the user and end your reply.';

  static forTurn(turn, { tasks = BackgroundTasks.shared, jobs = ConversationJobs.shared } = {}) {
    const { convId = null, modeTurn = null, evalOverrides = null } = turn || {};
    if (!convId || modeTurn || evalOverrides) return null;
    return new BackgroundTaskTools({ tasks, jobs, conversationId: convId });
  }

  constructor({ tasks, jobs, conversationId }) {
    this._tasks = tasks;
    this._jobs = jobs;
    this._conversationId = conversationId;
    this._startedThisTurn = false;
    this._lastTail = null;
  }

  get extraTools() {
    return [
      { name: BackgroundTaskTools.RUN, description: BackgroundTaskTools._runDescription(), inputSchema: BackgroundTaskTools._runSchema(), handler: (params, ctx) => this._start(params || {}, ctx || {}) },
      { name: BackgroundTaskTools.STATUS, description: 'How the background tasks of this conversation stand, and the result of any that has ended. For when the user asks; a running task reports back by itself. task_id narrows it to one task.', inputSchema: BackgroundTaskTools._idSchema(false), handler: (params, ctx) => this._status(params || {}, ctx || {}) },
      { name: BackgroundTaskTools.STOP, description: 'Stop a background task that is queued or running.', inputSchema: BackgroundTaskTools._idSchema(true), handler: (params) => this._stop(params || {}) },
    ];
  }

  get note() {
    return BackgroundTaskText.NOTE;
  }

  get awaitsLaterResult() {
    return this._startedThisTurn;
  }

  tail() {
    const line = BackgroundTaskText.tail(this._tasks.listFor(this._conversationId), (task) => this._progressOf(task));
    const changed = BackgroundTaskTools._withoutTimes(line) !== BackgroundTaskTools._withoutTimes(this._lastTail);
    this._lastTail = line;
    return changed ? line : null;
  }

  async _start(params, ctx) {
    const tool = String(params.tool || params.name || '').trim();
    const detached = ctx.detached || null;
    if (!detached) return { success: false, error: BackgroundTaskTools.NOT_HERE };
    const refusal = BackgroundTaskRules.refusal(tool, detached.allows(tool) ? detached.kindOf(tool) : null);
    if (refusal) return { success: false, error: refusal };
    const admitted = await detached.admit(tool, BackgroundTaskTools._arguments(params));
    if (admitted.refusal) return BackgroundTaskTools._refused(admitted.refusal);
    const task = this._tasks.start(this._spec(tool, admitted.params, params, ctx));
    this._startedThisTurn = true;
    return {
      success: true, task_id: task.id,
      summary: `In the background: ${task.title}`,
      message: BackgroundTaskText.started(this._tasks.get(task.id) || task, this._tasks.queuedAhead(task.id)),
    };
  }

  _spec(tool, toolParams, params, ctx) {
    const detached = ctx.detached;
    let follow = null;
    const run = ({ report, isStopped, artifacts }) => {
      const call = (name, callParams) => detached.run(name, callParams, { report, isStopped, artifacts });
      if (!TerminalRunFollow.handles(tool)) return call(tool, toolParams);
      follow = new TerminalRunFollow({ call, isStopped, report });
      return follow.run(toolParams);
    };
    return {
      conversationId: this._conversationId,
      batchId: ctx.assistantMessageId || null,
      tool,
      title: BackgroundTaskTools._title(params.title, tool, toolParams),
      lane: BackgroundTaskRules.laneOf(tool),
      run,
      stop: () => (follow ? follow.stop() : undefined),
    };
  }

  _status(params, ctx) {
    const wanted = BackgroundTaskTools._id(params);
    const all = this._tasks.listFor(this._conversationId);
    const tasks = wanted ? all.filter((task) => task.id === wanted) : all.filter((task) => !task.delivered);
    if (wanted && !tasks.length) return { success: false, error: `There is no background task ${wanted} in this conversation.` };
    if (!tasks.length) return { success: true, summary: 'No tasks', message: BackgroundTaskTools.NO_TASKS };
    const ended = tasks.filter((task) => task.endedAt != null);
    for (const task of ended) BackgroundTaskTools._show(this._tasks.markRead(task.id), ctx);
    const going = tasks.filter((task) => task.endedAt == null);
    const lines = [
      ...going.map((task) => BackgroundTaskText.line(task, this._progressOf(task))),
      ...ended.map((task) => BackgroundTaskText.outcome(task)),
    ];
    return {
      success: true,
      summary: [going.length ? `${going.length} going` : null, ended.length ? `${ended.length} ended` : null].filter(Boolean).join(', '),
      message: lines.join('\n\n') + (going.length ? `\n\n${BackgroundTaskTools.NOTHING_TO_DO}` : ''),
    };
  }

  _stop(params) {
    const id = BackgroundTaskTools._id(params);
    const task = id ? this._tasks.get(id) : null;
    if (!task || task.conversationId !== String(this._conversationId)) return { success: false, error: `There is no background task ${id || '(no task_id given)'} in this conversation.` };
    if (!this._tasks.stop(id, BackgroundTasks.BY_MODEL)) return { success: true, summary: 'Already ended', message: `Task ${id} had already ended.` };
    return { success: true, summary: `Stopping ${task.title}`, message: `Task ${id} "${task.title}" is being stopped.` };
  }

  _progressOf(task) {
    const job = this._jobs.activeFor(this._conversationId).find((candidate) => candidate.id === task.id);
    if (!job || job.detail === BackgroundTasks.QUEUED_DETAIL) return '';
    return ConversationJobReminder.progress(job);
  }

  static _refused(refusal) {
    if (!refusal || !refusal.autoActivated) return refusal;
    return { ...refusal, summary: 'Read the tool\'s instructions first' };
  }

  static _show(artifacts, ctx) {
    for (const artifact of artifacts) {
      if (Array.isArray(ctx.artifacts)) ctx.artifacts.push(artifact);
      if (typeof ctx.onArtifact === 'function') { try { ctx.onArtifact(artifact); } catch (_) {} }
    }
  }

  static _arguments(params) {
    const given = params.arguments !== undefined ? params.arguments : (params.args !== undefined ? params.args : params.params);
    if (given && typeof given === 'object' && !Array.isArray(given)) return given;
    if (typeof given === 'string') {
      try {
        const parsed = JSON.parse(given);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
      } catch (_) {}
    }
    return {};
  }

  static _title(given, tool, toolParams) {
    const own = typeof given === 'string' ? given.trim() : '';
    const key = BackgroundTaskTools.TITLE_KEYS.find((name) => typeof toolParams[name] === 'string' && toolParams[name].trim());
    const text = own || (key ? `${tool}: ${toolParams[key].trim()}` : tool);
    return text.replace(/\s+/g, ' ').slice(0, BackgroundTaskTools.TITLE_MAX);
  }

  static _id(params) {
    const id = params.task_id !== undefined ? params.task_id : params.id;
    return id == null ? '' : String(id).trim();
  }

  static _withoutTimes(line) {
    return line ? line.replace(/\b(for|after) \d+ (s|min)\b|\b\d+ h \d+ min\b/g, '') : '';
  }

  static _runDescription() {
    return 'Start a tool call in the background and get a task id at once. For calls that take minutes or longer: '
      + `${TerminalRunFollow.RUN_TOOL} for a long command, ${BackgroundTaskRules.MEDIA_TOOLS.slice(0, 3).join(', ')} and the other renders (they queue and run one at a time), `
      + 'or a slow tool from an extension. The results come back to you in an automated message when every task from this reply has ended.';
  }

  static _runSchema() {
    return {
      type: 'object',
      properties: {
        tool: { type: 'string', description: 'The name of the tool to run, for example terminal_run or generate_image.' },
        arguments: { type: 'object', description: 'The arguments for that tool, exactly as you would pass them to it.' },
        title: { type: 'string', description: 'A few words on what this task does, shown to the user.' },
      },
      required: ['tool', 'arguments'],
    };
  }

  static _idSchema(required) {
    return {
      type: 'object',
      properties: { task_id: { type: 'string', description: 'The task id, for example "bg-1".' } },
      required: required ? ['task_id'] : [],
    };
  }
}

module.exports = BackgroundTaskTools;
