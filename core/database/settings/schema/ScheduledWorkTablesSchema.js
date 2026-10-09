class ScheduledWorkTablesSchema {
  static SQL = `
    CREATE TABLE IF NOT EXISTS llm_artifact_tasks (
      id           TEXT PRIMARY KEY,
      root_id      TEXT NOT NULL,
      title        TEXT NOT NULL DEFAULT 'Scheduled update',
      prompt       TEXT NOT NULL,
      interval_ms  INTEGER NOT NULL DEFAULT 1800000,
      model_ref    TEXT,
      enabled      INTEGER NOT NULL DEFAULT 1,
      last_run_at  TEXT,
      next_run_at  TEXT,
      last_status  TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_llm_artifact_tasks_root
      ON llm_artifact_tasks (root_id);

    CREATE TABLE IF NOT EXISTS llm_artifact_task_runs (
      id              TEXT PRIMARY KEY,
      task_id         TEXT NOT NULL,
      conversation_id TEXT,
      status          TEXT NOT NULL DEFAULT 'running',
      started_at      TEXT NOT NULL,
      completed_at    TEXT,
      error           TEXT,
      summary         TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_llm_artifact_task_runs_task
      ON llm_artifact_task_runs (task_id, started_at DESC);

    CREATE TABLE IF NOT EXISTS llm_scheduled_tasks (
      id              TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      title           TEXT NOT NULL DEFAULT 'Scheduled task',
      prompt          TEXT NOT NULL,
      interval_ms     INTEGER NOT NULL DEFAULT 3600000,
      enabled         INTEGER NOT NULL DEFAULT 1,
      last_run_at     TEXT,
      next_run_at     TEXT,
      last_status     TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_llm_scheduled_tasks_conv
      ON llm_scheduled_tasks (conversation_id);

    CREATE TABLE IF NOT EXISTS llm_scheduled_task_runs (
      id              TEXT PRIMARY KEY,
      task_id         TEXT NOT NULL,
      conversation_id TEXT,
      kind            TEXT NOT NULL DEFAULT 'scheduled',
      status          TEXT NOT NULL DEFAULT 'running',
      started_at      TEXT NOT NULL,
      completed_at    TEXT,
      error           TEXT,
      response        TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_llm_scheduled_task_runs_task
      ON llm_scheduled_task_runs (task_id, started_at DESC);
  `;
}

module.exports = ScheduledWorkTablesSchema;
