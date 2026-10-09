const ScheduledTaskToolSpecs = require('./ScheduledTaskToolSpecs');
const TaskInterval = require('./TaskInterval');
const TestRunOutcome = require('./TestRunOutcome');

class ScheduledTaskTools {
  static CREATE_DEFAULT_MINUTES = 60;
  static NO_TASK = 'this conversation has no scheduled task yet; use create_scheduled_task';

  constructor({ taskStore, getScheduler, getChatStore = null, emitEvent = () => {} }) {
    this._store = taskStore;
    this._getScheduler = getScheduler;
    this._getChatStore = getChatStore;
    this._emit = emitEvent;
  }

  build() {
    return [
      { ...ScheduledTaskToolSpecs.create(), handler: (params, ctx) => this.create(params, ctx) },
      { ...ScheduledTaskToolSpecs.update(), handler: (params, ctx) => this.update(params, ctx) },
      { ...ScheduledTaskToolSpecs.run(), handler: (params, ctx) => this.runNow(params, ctx) },
    ];
  }

  async create(params = {}, ctx = {}) {
    const conversationId = ctx.conversationId;
    if (!conversationId) return { success: false, error: 'no conversation for this turn' };
    if (this._store.getByConversation(conversationId)) {
      return { success: false, error: 'this conversation already has a scheduled task; use update_scheduled_task' };
    }
    const prompt = String(params.prompt || '').trim();
    if (!prompt) return { success: false, error: 'prompt is required' };
    const task = this._createTask(conversationId, params, prompt);
    const result = { success: true, task: { id: task.id, title: task.title, frequency: TaskInterval.describe(task.intervalMs), nextRunAt: task.nextRunAt } };
    if (params.run_test !== false) result.test = await this._testAfterCreate(task.id);
    return result;
  }

  async update(params = {}, ctx = {}) {
    const task = this._taskFor(ctx);
    if (!task) return { success: false, error: ScheduledTaskTools.NO_TASK };
    const patch = ScheduledTaskTools._patchFrom(params);
    const next = this._store.update(task.id, patch);
    if (patch.title) this._syncConversationTitle(ctx.conversationId, next.title);
    this._emit('tasks-changed', { taskId: task.id });
    const result = {
      success: true,
      task: { id: next.id, title: next.title, frequency: TaskInterval.describe(next.intervalMs), enabled: next.enabled, nextRunAt: next.nextRunAt },
    };
    if (params.run_test === true) result.test = await this._testAfterUpdate(task.id);
    return result;
  }

  async runNow(_params, ctx = {}) {
    const task = this._taskFor(ctx);
    if (!task) return { success: false, error: ScheduledTaskTools.NO_TASK };
    const scheduler = this._scheduler();
    if (!scheduler) return { success: false, error: 'scheduler not ready; try again shortly' };
    const outcome = TestRunOutcome.from(await scheduler.runInline(task.id, { kind: 'manual' }));
    return { success: true, task: { id: task.id, title: task.title }, run: outcome };
  }

  _createTask(conversationId, params, prompt) {
    const task = this._store.create({
      conversationId,
      title: params.title,
      prompt,
      intervalMs: TaskInterval.fromMinutes(params.every_minutes, ScheduledTaskTools.CREATE_DEFAULT_MINUTES),
    });
    this._syncConversationTitle(conversationId, task.title);
    this._emit('tasks-changed', { taskId: task.id });
    return task;
  }

  static _patchFrom(params) {
    const patch = {};
    if (params.title != null) patch.title = params.title;
    if (params.prompt != null) patch.prompt = params.prompt;
    if (params.every_minutes != null) patch.intervalMs = TaskInterval.fromMinutes(params.every_minutes, 0);
    if (params.enabled !== undefined) patch.enabled = !!params.enabled;
    return patch;
  }

  async _testAfterCreate(taskId) {
    const scheduler = this._scheduler();
    if (!scheduler) return { ran: false, error: 'scheduler not ready; the task will still run on schedule' };
    return TestRunOutcome.from(await scheduler.runInline(taskId, { kind: 'test' }));
  }

  async _testAfterUpdate(taskId) {
    const scheduler = this._scheduler();
    if (!scheduler) return { ran: false, error: 'scheduler not ready' };
    return TestRunOutcome.from(await scheduler.runInline(taskId, { kind: 'test' }));
  }

  _taskFor(ctx) {
    return ctx.conversationId ? this._store.getByConversation(ctx.conversationId) : null;
  }

  _scheduler() {
    return (this._getScheduler && this._getScheduler()) || null;
  }

  _syncConversationTitle(conversationId, title) {
    try {
      const chatStore = this._getChatStore && this._getChatStore();
      if (chatStore && title && typeof chatStore.renameConversation === 'function') chatStore.renameConversation(conversationId, title);
    } catch (_) {}
  }
}

module.exports = ScheduledTaskTools;
