const IntervalTaskStore = require('./IntervalTaskStore');

class ArtifactTaskStore extends IntervalTaskStore {
  static TASK_TABLE = 'llm_artifact_tasks';
  static RUN_TABLE = 'llm_artifact_task_runs';
  static TASK_ID_PREFIX = 'atask';
  static RUN_ID_PREFIX = 'atrun';
  static MAX_INTERVAL_MS = 24 * 60 * 60 * 1000;
  static DEFAULT_INTERVAL_MS = 30 * 60 * 1000;
  static DEFAULT_TITLE = 'Scheduled update';
  static DEFAULT_RUN_LIMIT = 20;
  static OWNER = { column: 'root_id', field: 'rootId', missing: 'a task needs the target artifact rootId' };
  static MISSING_PROMPT = 'a task needs a prompt';
  static OUTCOME = { column: 'summary', field: 'summary', maxChars: 500 };
  static TASK_EXTRAS = [{ column: 'model_ref', field: 'modelRef', fallback: null }];

  constructor(options = {}) {
    super(options);
    this._listByRoot = this._db.prepare('SELECT * FROM llm_artifact_tasks WHERE root_id = ? ORDER BY created_at DESC');
    this._deleteByRoot = this._db.prepare('DELETE FROM llm_artifact_tasks WHERE root_id = ?');
  }

  listByRoot(rootId) {
    return this._listByRoot.all(String(rootId || '')).map((r) => this._hydrateTask(r));
  }

  deleteByRoot(rootId) {
    const root = String(rootId || '');
    for (const task of this._listByRoot.all(root)) this._deleteRunsForTask.run(task.id);
    return this._deleteByRoot.run(root).changes;
  }
}

module.exports = ArtifactTaskStore;
