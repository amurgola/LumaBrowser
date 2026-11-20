const BackgroundTask = require('./BackgroundTask');
const BackgroundTaskResult = require('./BackgroundTaskResult');
const SerialLane = require('./SerialLane');
const ConversationJobs = require('../jobs/ConversationJobs');

class BackgroundTasks {
  static JOB_KIND = 'background-task';
  static BY_USER = 'user';
  static BY_MODEL = 'model';
  static QUEUED_DETAIL = 'queued';
  static KEEP_DELIVERED = 30;

  static shared = new BackgroundTasks();

  constructor({ jobs = ConversationJobs.shared, now = () => Date.now() } = {}) {
    this._jobs = jobs;
    this._now = now;
    this._tasks = new Map();
    this._runs = new Map();
    this._lanes = new Map();
    this._listeners = new Set();
    this._untilChatIdle = () => Promise.resolve();
    this._sequence = 0;
  }

  useChatIdle(untilChatIdle) {
    if (typeof untilChatIdle === 'function') this._untilChatIdle = untilChatIdle;
  }

  start(spec) {
    const task = this._register(spec);
    const work = () => this._execute(task, spec);
    const settled = spec.lane ? this._lane(spec.lane).push(work) : work();
    settled.catch(() => {});
    return task.view(this._now());
  }

  stop(id, by = BackgroundTasks.BY_USER) {
    const task = this._tasks.get(String(id));
    if (!task || task.ended) return false;
    task.stopRequestedBy = task.stopRequestedBy || by;
    if (task.state === BackgroundTask.QUEUED) { this._end(task, BackgroundTask.CANCELED, ''); return true; }
    const run = this._runs.get(task.id);
    if (run && typeof run.stop === 'function') Promise.resolve().then(() => run.stop()).catch(() => {});
    return true;
  }

  get(id) {
    const task = this._tasks.get(String(id));
    return task ? task.view(this._now()) : null;
  }

  listFor(conversationId) {
    return this._of(conversationId).map((task) => task.view(this._now()));
  }

  queuedAhead(id) {
    const task = this._tasks.get(String(id));
    const run = task && this._runs.get(task.id);
    if (!task || task.state !== BackgroundTask.QUEUED || !run || !run.lane) return 0;
    return [...this._tasks.values()].filter((other) => !other.ended && other !== task
      && this._runs.get(other.id) && this._runs.get(other.id).lane === run.lane && other.createdAt <= task.createdAt).length;
  }

  markRead(id) {
    const task = this._tasks.get(String(id));
    if (!task || !task.ended) return [];
    task.delivered = true;
    const unseen = task.artifactsShown ? [] : task.artifacts.slice();
    task.artifactsShown = true;
    return unseen;
  }

  endedUndelivered(conversationId) {
    const batches = new Map();
    for (const task of this._of(conversationId)) {
      if (!batches.has(task.batchId)) batches.set(task.batchId, []);
      batches.get(task.batchId).push(task);
    }
    return [...batches.values()]
      .filter((tasks) => tasks.every((task) => task.ended))
      .flat()
      .filter((task) => !task.delivered)
      .map((task) => task.view(this._now()));
  }

  markDelivered(ids) {
    for (const id of ids) {
      const task = this._tasks.get(String(id));
      if (!task || !task.ended) continue;
      task.delivered = true;
      task.artifactsShown = true;
    }
    this._prune();
  }

  onBatchEnded(listener) {
    if (typeof listener !== 'function') return () => {};
    this._listeners.add(listener);
    return () => { this._listeners.delete(listener); };
  }

  _register(spec) {
    this._sequence += 1;
    const task = new BackgroundTask({
      id: `bg-${this._sequence}`, conversationId: spec.conversationId, batchId: spec.batchId, tool: spec.tool,
      title: spec.title, now: this._now(),
    });
    this._tasks.set(task.id, task);
    this._runs.set(task.id, { lane: spec.lane || null, stop: null });
    this._jobs.start({
      id: task.id, conversationId: task.conversationId, kind: BackgroundTasks.JOB_KIND, title: task.title,
      cancel: () => this.stop(task.id, BackgroundTasks.BY_USER),
    });
    this._jobs.update(task.id, { detail: BackgroundTasks.QUEUED_DETAIL });
    return task;
  }

  async _execute(task, spec) {
    if (spec.lane) await this._untilChatIdle();
    if (task.ended) return;
    task.begin(this._now());
    this._runs.get(task.id).stop = typeof spec.stop === 'function' ? spec.stop : null;
    this._jobs.update(task.id, { detail: '' });
    const result = await this._run(task, spec);
    if (task.ended) return;
    this._end(task, BackgroundTasks._endState(task, result), BackgroundTaskResult.text(result));
  }

  async _run(task, spec) {
    try {
      return await spec.run({
        report: (progress) => { if (!task.ended) this._jobs.update(task.id, progress || {}); },
        isStopped: () => !!task.stopRequestedBy,
        artifacts: task.artifacts,
      });
    } catch (err) {
      return { success: false, error: (err && err.message) || String(err) };
    }
  }

  static _endState(task, result) {
    if (task.stopRequestedBy) return BackgroundTask.CANCELED;
    return BackgroundTaskResult.succeeded(result) ? BackgroundTask.DONE : BackgroundTask.FAILED;
  }

  _end(task, state, result) {
    task.end(state, result, this._now());
    this._runs.delete(task.id);
    this._jobs.finish(task.id, { state, message: '' });
    if (this._of(task.conversationId).filter((other) => other.batchId === task.batchId).every((other) => other.ended)) {
      this._tellBatchEnded({ conversationId: task.conversationId, batchId: task.batchId });
    }
  }

  _tellBatchEnded(payload) {
    for (const listener of this._listeners) {
      try { listener(payload); } catch (_) {}
    }
  }

  _of(conversationId) {
    const wanted = String(conversationId || '');
    return [...this._tasks.values()].filter((task) => task.conversationId === wanted);
  }

  _lane(name) {
    if (!this._lanes.has(name)) this._lanes.set(name, new SerialLane());
    return this._lanes.get(name);
  }

  _prune() {
    const delivered = [...this._tasks.values()].filter((task) => task.ended && task.delivered);
    for (const task of delivered.slice(0, Math.max(0, delivered.length - BackgroundTasks.KEEP_DELIVERED))) this._tasks.delete(task.id);
  }
}

module.exports = BackgroundTasks;
