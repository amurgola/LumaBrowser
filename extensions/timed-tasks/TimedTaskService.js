const RecordId = require('../../core/database/RecordId');
const TaskFields = require('./TaskFields');

class TimedTaskService {
  static NOT_FOUND = 'Task not found';

  constructor({ repository, runner, broadcast, now = () => new Date() }) {
    this._repository = repository;
    this._runner = runner;
    this._broadcast = broadcast;
    this._now = now;
  }

  recoverAfterRestart() {
    this._repository.markInterruptedRuns(this._now().toISOString());
    this._repository.resetRunningTasks();
    const nowMs = this._now().getTime();
    for (const task of this._repository.enabledWithoutNextRun()) {
      this._repository.update(task.id, { next_run: TaskFields.nextRun(task.repeat_interval, nowMs) });
    }
    return this._repository.countEnabled();
  }

  getAllTasks() {
    return this._repository.all();
  }

  getTask(id) {
    return this._repository.get(id);
  }

  createTask(data) {
    const columns = TaskFields.forCreate(data);
    const id = RecordId.create('task');
    const nextRun = columns.enabled ? new Date(this._now().getTime() + columns.repeat_interval).toISOString() : null;
    this._repository.insert({ id, ...columns, next_run: nextRun, status: 'idle' });
    this._broadcast.emit('created', id);
    return this._repository.get(id);
  }

  updateTask(id, updates = {}) {
    const existing = this._repository.get(id);
    if (!existing) return null;
    const columns = TaskFields.forUpdate(updates);
    this._repository.update(id, columns);
    if (updates.repeatInterval !== undefined || updates.enabled !== undefined) this._rearm(id, existing, columns);
    this._broadcast.emit('updated', id);
    return this._repository.get(id);
  }

  setEnabled(id, enabled) {
    return this.updateTask(id, { enabled: !!enabled });
  }

  deleteTask(id) {
    const result = this._repository.delete(id);
    this._broadcast.emit('deleted', id);
    return result;
  }

  getTaskRuns(taskId, limit = 20, offset = 0) {
    return this._repository.listRuns(taskId, limit, offset);
  }

  getRun(runId) {
    return this._repository.getRun(runId);
  }

  getRunLog(runId) {
    const run = this._repository.getRun(runId);
    if (!run) return null;
    return {
      run,
      task: this._repository.get(run.task_id) || null,
      log: run.conversation_log ? JSON.parse(run.conversation_log) : null,
    };
  }

  async triggerNow(id, { silent = false } = {}) {
    const task = this._repository.get(id);
    if (!task) throw new Error(TimedTaskService.NOT_FOUND);
    return this._runner.execute(task, { silent });
  }

  _rearm(id, existing, columns) {
    const enabled = columns.enabled !== undefined ? !!columns.enabled : !!existing.enabled;
    const interval = columns.repeat_interval !== undefined ? columns.repeat_interval : existing.repeat_interval;
    this._repository.update(id, { next_run: enabled ? TaskFields.nextRun(interval) : null });
  }
}

module.exports = TimedTaskService;
