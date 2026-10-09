class TriggerTablesSchema {
  static SQL = `
    CREATE TABLE IF NOT EXISTS llm_triggers (
      id                   TEXT PRIMARY KEY,
      conversation_id      TEXT NOT NULL,
      title                TEXT NOT NULL DEFAULT 'Trigger',
      kind                 TEXT NOT NULL DEFAULT 'webhook',
      hook_token           TEXT UNIQUE,
      source               TEXT NOT NULL DEFAULT '{}',
      action               TEXT NOT NULL DEFAULT '{}',
      sample               TEXT,
      last_test            TEXT,
      enabled              INTEGER NOT NULL DEFAULT 0,
      fire_count           INTEGER NOT NULL DEFAULT 0,
      last_fired_at        TEXT,
      last_status          TEXT,
      consecutive_failures INTEGER NOT NULL DEFAULT 0,
      paused_reason        TEXT,
      last_drift           TEXT,
      created_at           TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_llm_triggers_conv
      ON llm_triggers (conversation_id);

    CREATE TABLE IF NOT EXISTS llm_trigger_runs (
      id              TEXT PRIMARY KEY,
      trigger_id      TEXT NOT NULL,
      conversation_id TEXT,
      kind            TEXT NOT NULL DEFAULT 'event',
      status          TEXT NOT NULL DEFAULT 'running',
      started_at      TEXT NOT NULL,
      completed_at    TEXT,
      error           TEXT,
      response        TEXT,
      event           TEXT,
      dedupe_key      TEXT,
      attempt         INTEGER NOT NULL DEFAULT 1,
      retry_of        TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_llm_trigger_runs_trigger
      ON llm_trigger_runs (trigger_id, started_at DESC);
    CREATE INDEX IF NOT EXISTS idx_llm_trigger_runs_dedupe
      ON llm_trigger_runs (trigger_id, dedupe_key);

    CREATE TABLE IF NOT EXISTS llm_trigger_deliveries (
      id          TEXT PRIMARY KEY,
      trigger_id  TEXT NOT NULL,
      at          TEXT NOT NULL,
      source      TEXT NOT NULL DEFAULT 'webhook',
      outcome     TEXT NOT NULL,
      detail      TEXT,
      run_id      TEXT,
      dedupe_key  TEXT,
      remote      TEXT,
      event       TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_llm_trigger_deliveries_trigger
      ON llm_trigger_deliveries (trigger_id, at DESC);

    CREATE TABLE IF NOT EXISTS llm_trigger_versions (
      id          TEXT PRIMARY KEY,
      trigger_id  TEXT NOT NULL,
      n           INTEGER NOT NULL,
      at          TEXT NOT NULL,
      origin      TEXT NOT NULL DEFAULT 'edit',
      action      TEXT NOT NULL,
      config_hash TEXT NOT NULL,
      tested      INTEGER NOT NULL DEFAULT 0,
      test_at     TEXT,
      test_run_id TEXT,
      was_armed   INTEGER NOT NULL DEFAULT 0,
      note        TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_llm_trigger_versions_trigger
      ON llm_trigger_versions (trigger_id, n DESC);
  `;
}

module.exports = TriggerTablesSchema;
