const TimedTaskSchema = require('./TimedTaskSchema');
const TimedTaskRepository = require('./TimedTaskRepository');
const TimedTaskRunner = require('./TimedTaskRunner');
const TimedTaskScheduler = require('./TimedTaskScheduler');
const TimedTaskService = require('./TimedTaskService');
const TaskBroadcast = require('./TaskBroadcast');
const TaskWebhook = require('./TaskWebhook');
const TimedTaskIpcHandlers = require('./TimedTaskIpcHandlers');

class TimedTasksExtension {
  static MISSING_AI_CHAT = 'timed-tasks: the ai-chat extension did not expose run(), cannot activate';

  constructor(overrides = {}) {
    this._overrides = overrides;
    this._runner = null;
    this._scheduler = null;
    this._api = null;
  }

  async activate(context) {
    const aiChat = TimedTasksExtension._requireAiChat(context.extensions);
    TimedTaskSchema.ensure(context.db);
    const service = this._buildService(context, aiChat);
    const enabledCount = service.recoverAfterRestart();
    this._scheduler.start();
    console.log(`timed-tasks: scheduler armed for ${enabledCount} active task(s)`);
    TimedTaskIpcHandlers.register(context.ipc, service);
    this._api = TimedTasksExtension._publicApi(service);
    return this._api;
  }

  async deactivate() {
    if (this._scheduler) this._scheduler.stop();
    if (this._runner) this._runner.reset();
    this._runner = null;
    this._scheduler = null;
    this._api = null;
  }

  getApi() {
    return this._api;
  }

  _buildService(context, aiChat) {
    const repository = new TimedTaskRepository(context.db);
    const sendOverride = this._overrides.broadcastSend ? { send: this._overrides.broadcastSend } : {};
    const broadcast = new TaskBroadcast({ ipc: context.ipc, repository, ...sendOverride });
    const webhook = this._overrides.webhook || new TaskWebhook();
    this._runner = new TimedTaskRunner({ repository, aiChat, webhook, broadcast });
    this._scheduler = new TimedTaskScheduler({ repository, runner: this._runner });
    return new TimedTaskService({ repository, runner: this._runner, broadcast });
  }

  static _requireAiChat(extensions) {
    const aiChat = extensions && extensions['ai-chat'];
    if (!aiChat || typeof aiChat.run !== 'function') throw new Error(TimedTasksExtension.MISSING_AI_CHAT);
    return aiChat;
  }

  static _publicApi(service) {
    return {
      getAllTasks: () => service.getAllTasks(),
      getTask: (id) => service.getTask(id),
      setEnabled: (id, enabled) => service.setEnabled(id, enabled),
      updateTask: (id, updates) => service.updateTask(id, updates),
      getTaskRuns: (taskId, limit, offset) => service.getTaskRuns(taskId, limit, offset),
      getRun: (runId) => service.getRun(runId),
      triggerNow: (id, options) => service.triggerNow(id, options),
      createTask: async (taskData) => service.createTask(taskData),
      deleteTask: (id) => service.deleteTask(id),
    };
  }
}

module.exports = TimedTasksExtension;
