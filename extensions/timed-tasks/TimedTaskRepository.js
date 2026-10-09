class TimedTaskRepository {
  constructor(db) {
    this._db = db;
  }

  get(id) {
    return this._db.query('SELECT * FROM timed_tasks WHERE id = ?', id)[0] || null;
  }

  all() {
    return this._db.query('SELECT * FROM timed_tasks ORDER BY created_at DESC');
  }

  enabled() {
    return this._db.query('SELECT * FROM timed_tasks WHERE enabled = 1');
  }

  enabledWithoutNextRun() {
    return this._db.query("SELECT * FROM timed_tasks WHERE enabled = 1 AND (next_run IS NULL OR next_run = '')");
  }

  countEnabled() {
    const row = this._db.query('SELECT COUNT(*) AS n FROM timed_tasks WHERE enabled = 1')[0];
    return (row && row.n) || 0;
  }

  insert(row) {
    this._db.run(
      'INSERT INTO timed_tasks (id, name, request_prompt, response_prompt, repeat_interval, webhook_url, enabled, next_run, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      row.id, row.name, row.request_prompt, row.response_prompt, row.repeat_interval, row.webhook_url, row.enabled,
      row.next_run, row.status,
    );
  }

  update(id, columns) {
    const names = Object.keys(columns);
    if (!names.length) return;
    this._db.run(`UPDATE timed_tasks SET ${names.map((n) => `${n} = ?`).join(', ')} WHERE id = ?`, ...Object.values(columns), id);
  }

  recordOutcome(id, { lastRun, lastStatus, lastError }) {
    this._db.run('UPDATE timed_tasks SET last_run = ?, last_status = ?, last_error = ? WHERE id = ?', lastRun, lastStatus, lastError, id);
  }

  delete(id) {
    this._db.run('DELETE FROM timed_task_runs WHERE task_id = ?', id);
    return this._db.run('DELETE FROM timed_tasks WHERE id = ?', id);
  }

  resetRunningTasks() {
    this._db.run("UPDATE timed_tasks SET status = 'idle' WHERE status = 'running'");
  }

  insertRun(row) {
    this._db.run(
      'INSERT INTO timed_task_runs (id, task_id, request_prompt, status, started_at) VALUES (?, ?, ?, ?, ?)',
      row.id, row.task_id, row.request_prompt, row.status, row.started_at,
    );
  }

  finishRun(runId, { response, status, completedAt, error, conversationLog }) {
    this._db.run(
      'UPDATE timed_task_runs SET response = ?, status = ?, completed_at = ?, error = ?, conversation_log = ? WHERE id = ?',
      response, status, completedAt, error, conversationLog, runId,
    );
  }

  markWebhookSent(runId) {
    this._db.run('UPDATE timed_task_runs SET webhook_sent = 1 WHERE id = ?', runId);
  }

  setRunError(runId, error) {
    this._db.run('UPDATE timed_task_runs SET error = ? WHERE id = ?', error, runId);
  }

  getRun(runId) {
    return this._db.query('SELECT * FROM timed_task_runs WHERE id = ?', runId)[0] || null;
  }

  listRuns(taskId, limit, offset) {
    return this._db.query('SELECT * FROM timed_task_runs WHERE task_id = ? ORDER BY started_at DESC LIMIT ? OFFSET ?', taskId, limit, offset);
  }

  markInterruptedRuns(nowIso) {
    this._db.run(
      "UPDATE timed_task_runs SET status = 'error', error = 'Interrupted by app shutdown', completed_at = COALESCE(completed_at, ?) WHERE status = 'running'",
      nowIso,
    );
  }
}

module.exports = TimedTaskRepository;
