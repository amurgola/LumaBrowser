class TimedTaskSchema {
  static TASKS_TABLE = `CREATE TABLE IF NOT EXISTS timed_tasks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      request_prompt TEXT NOT NULL,
      response_prompt TEXT DEFAULT '',
      repeat_interval INTEGER NOT NULL DEFAULT 3600000,
      webhook_url TEXT DEFAULT '',
      enabled INTEGER DEFAULT 1,
      last_run TEXT,
      next_run TEXT,
      status TEXT DEFAULT 'idle',
      last_status TEXT,
      last_error TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`;

  static RUNS_TABLE = `CREATE TABLE IF NOT EXISTS timed_task_runs (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      request_prompt TEXT,
      response TEXT,
      status TEXT DEFAULT 'pending',
      started_at TEXT,
      completed_at TEXT,
      error TEXT,
      webhook_sent INTEGER DEFAULT 0,
      conversation_log TEXT,
      FOREIGN KEY (task_id) REFERENCES timed_tasks(id)
    )`;

  static ADDED_COLUMNS = [
    'ALTER TABLE timed_task_runs ADD COLUMN conversation_log TEXT',
    "ALTER TABLE timed_tasks ADD COLUMN status TEXT DEFAULT 'idle'",
    'ALTER TABLE timed_tasks ADD COLUMN last_status TEXT',
    'ALTER TABLE timed_tasks ADD COLUMN last_error TEXT',
  ];

  static ensure(db) {
    db.run(TimedTaskSchema.TASKS_TABLE);
    db.run(TimedTaskSchema.RUNS_TABLE);
    for (const sql of TimedTaskSchema.ADDED_COLUMNS) {
      try { db.run(sql); } catch (_) {}
    }
  }
}

module.exports = TimedTaskSchema;
