const BackgroundTask = require('./BackgroundTask');
const BackgroundTasks = require('./BackgroundTasks');
const BackgroundTaskText = require('./BackgroundTaskText');
const BackgroundTaskTurn = require('./BackgroundTaskTurn');
const AgentNotices = require('../../../shared/AgentNotices');

class BackgroundTaskWake {
  static SETTLE_MS = 1500;

  constructor({ tasks, idle, turn, notices = AgentNotices }) {
    this._tasks = tasks;
    this._idle = idle;
    this._turn = turn;
    this._notices = notices;
    this._delivering = new Set();
    this._again = new Set();
  }

  watch() {
    return this._tasks.onBatchEnded(({ conversationId }) => {
      this.deliver(conversationId).catch((err) => console.error('[llm-chat] background task results were not delivered:', err && err.message));
    });
  }

  async deliver(conversationId) {
    if (this._delivering.has(conversationId)) { this._again.add(conversationId); return; }
    this._delivering.add(conversationId);
    try {
      do {
        this._again.delete(conversationId);
        await this._deliverOnce(conversationId);
      } while (this._again.has(conversationId));
    } finally {
      this._delivering.delete(conversationId);
    }
  }

  async _deliverOnce(conversationId) {
    for (;;) {
      await this._idle.until(BackgroundTaskWake.SETTLE_MS);
      const ended = this._tasks.endedUndelivered(conversationId);
      const toReport = BackgroundTaskWake._worthATurn(ended);
      const started = toReport.length ? await this._turn.start(conversationId, toReport, this._stillGoing(conversationId)) : null;
      if (started === BackgroundTaskTurn.BUSY) continue;
      if (!toReport.length) this._noteUserStops(conversationId, ended);
      this._tasks.markDelivered(ended.map((task) => task.id));
      return;
    }
  }

  _stillGoing(conversationId) {
    return this._tasks.listFor(conversationId).filter((task) => !BackgroundTask.END_STATES.includes(task.state));
  }

  static _worthATurn(ended) {
    const news = ended.filter((task) => !(task.state === BackgroundTask.CANCELED && task.stoppedBy === BackgroundTasks.BY_MODEL));
    return news.some((task) => task.state !== BackgroundTask.CANCELED) ? news : [];
  }

  _noteUserStops(conversationId, ended) {
    for (const task of ended.filter((candidate) => candidate.stoppedBy === BackgroundTasks.BY_USER)) {
      this._notices.enqueue(conversationId, `Background task ${BackgroundTaskText.line(task)}. It did not finish; do not start it again unless the user asks.`);
    }
  }
}

module.exports = BackgroundTaskWake;
