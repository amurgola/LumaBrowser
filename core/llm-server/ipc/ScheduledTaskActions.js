class ScheduledTaskActions {
  static UNAVAILABLE = 'scheduled tasks unavailable';
  static NOT_FOUND = 'task not found';
  static EMITTER = 'emitSchedTasksEvent';

  constructor({ deps, runConversations }) {
    this._deps = deps;
    this._store = deps.get('scheduledTaskStore');
    this._scheduler = deps.get('scheduledTaskScheduler');
    this._runs = runConversations;
  }

  list() {
    return { tasks: this._store ? this._store.listWithRunCounts() : [] };
  }

  get(id) {
    return { task: this._store ? this._store.get(id) : null };
  }

  runs(taskId, opts) {
    return { runs: this._store ? this._store.listRuns(taskId, opts || {}) : [] };
  }

  update(id, patch) {
    const store = this._requireStore();
    const task = store.update(id, patch || {});
    if (!task) throw new Error(ScheduledTaskActions.NOT_FOUND);
    this._changed({ taskId: id });
    return { task };
  }

  delete(id) {
    const task = this._requireStore().get(id);
    if (!task) throw new Error(ScheduledTaskActions.NOT_FOUND);
    this.deleteTask(task);
    this._changed({ taskId: id });
    return {};
  }

  async runNow(id) {
    if (!this._scheduler) throw new Error(ScheduledTaskActions.UNAVAILABLE);
    return this._scheduler.runNow(id);
  }

  deleteTask(task) {
    this._runs.purge(this._store.runConversationIds(task.id));
    this._store.delete(task.id);
  }

  deleteOwnedBy(conversationId) {
    try {
      if (!this._store) return;
      const owned = this._store.listByConversation(conversationId);
      for (const task of owned) this.deleteTask(task);
      if (owned.length) this._changed({});
    } catch (_) {}
  }

  _requireStore() {
    if (!this._store) throw new Error(ScheduledTaskActions.UNAVAILABLE);
    return this._store;
  }

  _changed(payload) {
    this._deps.emit(ScheduledTaskActions.EMITTER, 'tasks-changed', payload);
  }
}

module.exports = ScheduledTaskActions;
