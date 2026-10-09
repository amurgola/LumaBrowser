const IntervalTaskStore = require('./IntervalTaskStore');

class ScheduledTaskStore extends IntervalTaskStore {
  static TASK_TABLE = 'llm_scheduled_tasks';
  static RUN_TABLE = 'llm_scheduled_task_runs';
  static TASK_ID_PREFIX = 'stask';
  static RUN_ID_PREFIX = 'strun';
  static MAX_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
  static DEFAULT_INTERVAL_MS = 60 * 60 * 1000;
  static DEFAULT_TITLE = 'Scheduled task';
  static DEFAULT_RUN_LIMIT = 50;
  static OWNER = { column: 'conversation_id', field: 'conversationId', missing: 'a scheduled task needs the setup conversationId' };
  static MISSING_PROMPT = 'a scheduled task needs a prompt';
  static OUTCOME = { column: 'response', field: 'response', maxChars: 20000 };
  static RUN_EXTRAS = [{ column: 'kind', field: 'kind', fallback: 'scheduled' }];

  constructor(options = {}) {
    super(options);
    this._listWithCounts = this._db.prepare(`
      SELECT t.*, (SELECT COUNT(*) FROM llm_scheduled_task_runs r WHERE r.task_id = t.id) AS run_count
      FROM llm_scheduled_tasks t
      ORDER BY t.created_at DESC
    `);
    this._listByConversation = this._db.prepare('SELECT * FROM llm_scheduled_tasks WHERE conversation_id = ? ORDER BY created_at ASC');
    this._runConversationIds = this._db.prepare(
      'SELECT conversation_id FROM llm_scheduled_task_runs WHERE task_id = ? AND conversation_id IS NOT NULL',
    );
  }

  listWithRunCounts() {
    return this._listWithCounts.all().map((r) => ({ ...this._hydrateTask(r), runCount: r.run_count || 0 }));
  }

  listByConversation(conversationId) {
    return this._listByConversation.all(String(conversationId || '')).map((r) => this._hydrateTask(r));
  }

  getByConversation(conversationId) {
    return this.listByConversation(conversationId)[0] || null;
  }

  runConversationIds(taskId) {
    return this._runConversationIds.all(taskId).map((r) => r.conversation_id).filter(Boolean);
  }
}

module.exports = ScheduledTaskStore;
