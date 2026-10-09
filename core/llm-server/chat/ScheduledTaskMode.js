const ChatModeRegistry = require('./ChatModeRegistry');
const ScheduledTaskPrompt = require('./scheduled-task/ScheduledTaskPrompt');
const ScheduledTaskTools = require('./scheduled-task/ScheduledTaskTools');

class ScheduledTaskMode {
  static ID = 'scheduled-task';
  static TEMPERATURE = 0.3;

  constructor({ taskStore, getScheduler, getChatStore = null, emitEvent = () => {}, registry = ChatModeRegistry.shared } = {}) {
    if (!taskStore) throw new Error('ScheduledTaskMode requires a taskStore');
    this._store = taskStore;
    this._getScheduler = getScheduler;
    this._registry = registry;
    this._tools = new ScheduledTaskTools({ taskStore, getScheduler, getChatStore, emitEvent });
  }

  register() {
    this._registry.register(this.descriptor());
    return this;
  }

  unregister() {
    return this._registry.unregister(ScheduledTaskMode.ID);
  }

  descriptor() {
    return {
      id: ScheduledTaskMode.ID,
      label: 'Scheduled Task',
      icon: String.fromCodePoint(0x23f1),
      description: 'Set up a recurring background task the AI runs on a schedule, with a history of every run.',
      requirements: ['llm'],
      launcher: 'sidebar',
      agent: true,
      buildTurn: (args) => this.buildTurn(args),
    };
  }

  buildTurn({ conversationId } = {}) {
    const task = conversationId ? this._store.getByConversation(conversationId) : null;
    const tools = this._tools.build();
    return {
      systemPrompt: ScheduledTaskPrompt.build(task, this._runToolGroups(conversationId)),
      temperature: ScheduledTaskMode.TEMPERATURE,
      agent: true,
      tools,
      allowedTools: tools.map((t) => t.name),
      noBrowser: true,
    };
  }

  _runToolGroups(conversationId) {
    try {
      const scheduler = this._getScheduler && this._getScheduler();
      return scheduler && typeof scheduler.describeRunTools === 'function' ? scheduler.describeRunTools(conversationId) : null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = ScheduledTaskMode;
