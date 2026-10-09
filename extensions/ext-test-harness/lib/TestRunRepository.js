class TestRunRepository {
  static RUNS_TABLE = `CREATE TABLE IF NOT EXISTS test_runs (
      id TEXT PRIMARY KEY,
      test_id TEXT NOT NULL,
      variant_id TEXT DEFAULT '',
      status TEXT DEFAULT 'running',
      started_at TEXT,
      completed_at TEXT,
      config TEXT,
      assertions TEXT,
      summary TEXT,
      duration_ms INTEGER DEFAULT 0
    )`;

  static LOGS_TABLE = `CREATE TABLE IF NOT EXISTS test_run_logs (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      full_log TEXT,
      FOREIGN KEY (run_id) REFERENCES test_runs(id)
    )`;

  constructor(db) {
    this._db = db;
  }

  ensureTables() {
    this._db.run(TestRunRepository.RUNS_TABLE);
    this._db.run(TestRunRepository.LOGS_TABLE);
  }

  saveSummary(summary) {
    this._db.run(
      `INSERT OR REPLACE INTO test_runs (id, test_id, variant_id, status, started_at, completed_at, config, assertions, summary, duration_ms)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      summary.id, summary.test_id, summary.variant_id, summary.status, summary.started_at, summary.completed_at,
      summary.config, summary.assertions, summary.summary, summary.duration_ms,
    );
  }

  saveFullLog(fullLog) {
    this._db.run('INSERT OR REPLACE INTO test_run_logs (id, run_id, full_log) VALUES (?, ?, ?)', fullLog.id, fullLog.run_id, fullLog.full_log);
  }

  list(limit = 50, offset = 0) {
    return this._db.query('SELECT * FROM test_runs ORDER BY started_at DESC LIMIT ? OFFSET ?', limit, offset);
  }

  detail(runId) {
    const run = this._db.query('SELECT * FROM test_runs WHERE id = ?', runId)[0];
    if (!run) return null;
    const log = this._db.query('SELECT full_log FROM test_run_logs WHERE run_id = ?', runId)[0];
    return {
      ...run,
      config: TestRunRepository._parse(run.config),
      assertions: TestRunRepository._parse(run.assertions),
      fullLog: log ? TestRunRepository._parse(log.full_log) : null,
    };
  }

  delete(runId) {
    this._db.run('DELETE FROM test_run_logs WHERE run_id = ?', runId);
    return this._db.run('DELETE FROM test_runs WHERE id = ?', runId).changes > 0;
  }

  clear() {
    this._db.run('DELETE FROM test_run_logs');
    this._db.run('DELETE FROM test_runs');
  }

  static _parse(text) {
    if (!text) return null;
    try { return JSON.parse(text); } catch (_) { return text; }
  }
}

module.exports = TestRunRepository;
