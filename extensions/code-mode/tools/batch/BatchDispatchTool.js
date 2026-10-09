const CodeTool = require('../CodeTool');
const BatchSpecs = require('./BatchSpecs');
const BatchLanes = require('./BatchLanes');

class BatchDispatchTool extends CodeTool {
  constructor({ scheduler, concurrency, runSubAgent }) {
    super();
    this._scheduler = scheduler;
    this._concurrency = concurrency;
    this._runSubAgent = runSubAgent;
  }

  get name() {
    return 'dispatch_batch';
  }

  get description() {
    return 'Fan several INDEPENDENT sub-tasks out in parallel, then review their combined results. '
      + `Up to ${this._concurrency} run at once (the server's prediction-slot budget). Use it when work splits cleanly, `
      + 'e.g. explore several areas at once, or edit several non-overlapping files. Each task has a "kind": '
      + '"explore" (read-only investigation) or "edit" (changes; you MUST list its target "files" so overlapping '
      + 'edits are serialized). Give each task a self-contained "instruction". Do NOT use it for steps that depend '
      + 'on each other; do those yourself in sequence.';
  }

  get inputSchema() {
    return {
      type: 'object',
      properties: {
        tasks: {
          type: 'array',
          description: 'The independent sub-tasks to run in parallel.',
          items: {
            type: 'object',
            properties: {
              kind: { type: 'string', enum: ['explore', 'edit'], description: 'explore (read-only) or edit' },
              instruction: { type: 'string', description: 'A self-contained instruction for this sub-task' },
              files: { type: 'array', items: { type: 'string' }, description: 'Target files (required for edit tasks)' },
            },
            required: ['instruction'],
          },
        },
      },
      required: ['tasks'],
    };
  }

  async handle(params, opts = {}) {
    const specs = params && params.tasks;
    const error = BatchSpecs.validate(specs);
    if (error) return { success: false, error };
    const tasks = BatchSpecs.toSchedulerTasks(specs);
    const isAborted = typeof opts.isAborted === 'function' ? opts.isAborted : () => false;
    if (isAborted()) return { success: false, error: 'Batch not started: the turn was stopped.' };
    const lanes = new BatchLanes(tasks, opts.emit);
    lanes.publish();
    const results = await this._runAll(tasks, lanes, opts.emit, isAborted);
    lanes.clear();
    return { success: true, message: BatchSpecs.summarize(tasks, results) };
  }

  _runAll(tasks, lanes, emit, isAborted) {
    const signal = { get aborted() { return isAborted(); } };
    return this._scheduler.run(tasks, {
      concurrency: this._concurrency,
      signal,
      runTask: (task) => this._runTask(task, lanes, emit, isAborted),
    });
  }

  async _runTask(task, lanes, emit, isAborted) {
    lanes.setStatus(task.id, 'running');
    try {
      const result = await this._runSubAgent(task, { emit, isAborted });
      lanes.setStatus(task.id, 'done');
      return result;
    } catch (e) {
      lanes.setStatus(task.id, 'error');
      throw e;
    }
  }
}

module.exports = BatchDispatchTool;
