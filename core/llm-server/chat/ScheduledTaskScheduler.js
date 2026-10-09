const IntervalTaskScheduler = require('./schedulers/IntervalTaskScheduler');
const SetupChatToolPolicy = require('./schedulers/SetupChatToolPolicy');

class ScheduledTaskScheduler extends IntervalTaskScheduler {
  static GATE_OWNER = 'scheduled-tasks';
  static KEEP_TRANSCRIPTS_KEY = 'core.scheduledTasks.keepTranscripts';
  static MESSAGE_ID_PREFIX = 'stask-msg';
  static CATCH_UP_DELAY_MS = 7000;
  static DISABLED_ERROR = 'task is paused';
  static OUTCOME_FIELD = 'response';

  constructor(options = {}) {
    super(options);
    this._toolPolicy = new SetupChatToolPolicy({ settingsDb: this.settingsDb, getRouter: this._getRouter });
  }

  describeRunTools(conversationId) {
    return this._toolPolicy.describe(conversationId, this._getAgentDeps());
  }

  async runInline(taskId, { kind = 'test' } = {}) {
    const task = this.taskStore.get(taskId);
    if (!task) return { success: false, error: 'task not found' };
    if (this._busy()) return { success: false, error: 'another scheduled run is in progress' };
    return IntervalTaskScheduler._started(await this._runTask(task, kind));
  }

  _runConfig(task, deps) {
    return this._toolPolicy.runConfig(task.conversationId, deps);
  }

  _runExtras(kind) {
    return { kind };
  }

  _eventExtras(_task, kind) {
    return { kind };
  }

  _buildRunPreamble(task, kind) {
    return [
      kind === 'test'
        ? `TEST RUN of the scheduled task "${task.title}" that was just configured. No user is watching live.`
        : `SCHEDULED BACKGROUND RUN of the task "${task.title}". No user is watching live.`,
      'Carry out the task in the user message now, using your tools as needed.',
      'Your final message is saved as this run\'s recorded outcome and shown in',
      'the task\'s run history, so end with a clear, self-contained report of',
      'what you did and the result (including the key data you found or sent).',
      'If a step fails, say exactly what failed. Do not ask questions; nobody',
      'can answer until the next run.',
    ].join(' ');
  }
}

module.exports = ScheduledTaskScheduler;
