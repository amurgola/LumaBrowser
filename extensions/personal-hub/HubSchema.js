class HubSchema {
  static TABLES = [
    `CREATE TABLE IF NOT EXISTS hub_calendar_sources (
      id            TEXT PRIMARY KEY,
      kind          TEXT NOT NULL,
      label         TEXT NOT NULL,
      color         TEXT DEFAULT '',
      config        TEXT NOT NULL DEFAULT '{}',
      enabled       INTEGER NOT NULL DEFAULT 1,
      interval_ms   INTEGER NOT NULL DEFAULT 900000,
      next_sync_at  TEXT,
      last_sync_at  TEXT,
      last_status   TEXT,
      last_error    TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS hub_calendar_events (
      id            TEXT PRIMARY KEY,
      source_id     TEXT NOT NULL,
      uid           TEXT NOT NULL,
      title         TEXT NOT NULL DEFAULT '',
      description   TEXT DEFAULT '',
      location      TEXT DEFAULT '',
      starts_at     TEXT NOT NULL,
      ends_at       TEXT,
      all_day       INTEGER NOT NULL DEFAULT 0,
      status        TEXT DEFAULT '',
      url           TEXT DEFAULT '',
      organizer     TEXT DEFAULT '',
      attendees     TEXT DEFAULT '[]',
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_hub_calendar_events_uid ON hub_calendar_events (source_id, uid, starts_at)`,
    `CREATE INDEX IF NOT EXISTS idx_hub_calendar_events_start ON hub_calendar_events (starts_at)`,
    `CREATE TABLE IF NOT EXISTS hub_notifications (
      id            TEXT PRIMARY KEY,
      received_at   TEXT NOT NULL,
      app           TEXT NOT NULL DEFAULT '',
      host          TEXT NOT NULL DEFAULT '',
      partition     TEXT DEFAULT '',
      tab_title     TEXT DEFAULT '',
      title         TEXT NOT NULL DEFAULT '',
      body          TEXT NOT NULL DEFAULT '',
      url           TEXT DEFAULT '',
      tag           TEXT DEFAULT '',
      sender        TEXT DEFAULT '',
      thread_key    TEXT NOT NULL DEFAULT '',
      thread_id     TEXT,
      dedupe_key    TEXT NOT NULL DEFAULT '',
      data          TEXT
    )`,
    `CREATE INDEX IF NOT EXISTS idx_hub_notifications_received ON hub_notifications (received_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_hub_notifications_thread ON hub_notifications (thread_id, received_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_hub_notifications_dedupe ON hub_notifications (dedupe_key)`,
    `CREATE TABLE IF NOT EXISTS hub_threads (
      id            TEXT PRIMARY KEY,
      app           TEXT NOT NULL DEFAULT '',
      thread_key    TEXT NOT NULL,
      title         TEXT NOT NULL DEFAULT '',
      participants  TEXT NOT NULL DEFAULT '[]',
      first_at      TEXT NOT NULL,
      last_at       TEXT NOT NULL,
      count         INTEGER NOT NULL DEFAULT 0,
      state         TEXT NOT NULL DEFAULT 'open',
      priority      TEXT NOT NULL DEFAULT 'normal',
      summary       TEXT DEFAULT '',
      labels        TEXT NOT NULL DEFAULT '[]',
      context       TEXT DEFAULT '{}',
      url           TEXT DEFAULT '',
      task_id       TEXT,
      snooze_until  TEXT,
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_hub_threads_key ON hub_threads (app, thread_key)`,
    `CREATE INDEX IF NOT EXISTS idx_hub_threads_state ON hub_threads (state, last_at DESC)`,
    `CREATE TABLE IF NOT EXISTS hub_board_columns (
      id            TEXT PRIMARY KEY,
      key           TEXT NOT NULL UNIQUE,
      title         TEXT NOT NULL,
      sort_order    INTEGER NOT NULL DEFAULT 0,
      is_done       INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS hub_task_sources (
      id            TEXT PRIMARY KEY,
      kind          TEXT NOT NULL,
      label         TEXT NOT NULL,
      config        TEXT NOT NULL DEFAULT '{}',
      enabled       INTEGER NOT NULL DEFAULT 1,
      interval_ms   INTEGER NOT NULL DEFAULT 300000,
      next_sync_at  TEXT,
      last_sync_at  TEXT,
      last_status   TEXT,
      last_error    TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS hub_tasks (
      id                TEXT PRIMARY KEY,
      source_id         TEXT,
      remote_id         TEXT,
      title             TEXT NOT NULL DEFAULT '',
      description       TEXT DEFAULT '',
      column_key        TEXT NOT NULL DEFAULT 'todo',
      remote_status     TEXT DEFAULT '',
      priority          TEXT DEFAULT '',
      due_at            TEXT,
      url               TEXT DEFAULT '',
      list_name         TEXT DEFAULT '',
      space_name        TEXT DEFAULT '',
      assignees         TEXT NOT NULL DEFAULT '[]',
      tags              TEXT NOT NULL DEFAULT '[]',
      sort_order        INTEGER NOT NULL DEFAULT 0,
      archived          INTEGER NOT NULL DEFAULT 0,
      pending_status    TEXT,
      remote_updated_at TEXT,
      synced_at         TEXT,
      created_at        TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_hub_tasks_remote ON hub_tasks (source_id, remote_id)`,
    `CREATE INDEX IF NOT EXISTS idx_hub_tasks_column ON hub_tasks (archived, column_key, sort_order)`,
    `CREATE TABLE IF NOT EXISTS hub_task_messages (
      id            TEXT PRIMARY KEY,
      task_id       TEXT NOT NULL,
      remote_id     TEXT,
      author        TEXT DEFAULT '',
      body          TEXT NOT NULL DEFAULT '',
      at            TEXT NOT NULL,
      direction     TEXT NOT NULL DEFAULT 'local',
      synced        INTEGER NOT NULL DEFAULT 0,
      sync_error    TEXT
    )`,
    `CREATE INDEX IF NOT EXISTS idx_hub_task_messages_task ON hub_task_messages (task_id, at)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_hub_task_messages_remote ON hub_task_messages (task_id, remote_id)`,
  ];

  static ADDED_COLUMNS = [
    'ALTER TABLE hub_tasks ADD COLUMN hidden INTEGER NOT NULL DEFAULT 0',
    "ALTER TABLE hub_tasks ADD COLUMN remote_status_color TEXT DEFAULT ''",
    "ALTER TABLE hub_tasks ADD COLUMN list_id TEXT DEFAULT ''",
    'ALTER TABLE hub_tasks ADD COLUMN sync_error TEXT',
  ];

  static DEFAULT_COLUMNS = [
    { key: 'backlog', title: 'Backlog', sort_order: 0, is_done: 0 },
    { key: 'todo', title: 'To do', sort_order: 1, is_done: 0 },
    { key: 'doing', title: 'In progress', sort_order: 2, is_done: 0 },
    { key: 'review', title: 'Review', sort_order: 3, is_done: 0 },
    { key: 'done', title: 'Done', sort_order: 4, is_done: 1 },
  ];

  static ensure(db) {
    for (const sql of HubSchema.TABLES) db.run(sql);
    for (const sql of HubSchema.ADDED_COLUMNS) {
      try { db.run(sql); } catch (_) {}
    }
    HubSchema._seedColumns(db);
  }

  static _seedColumns(db) {
    const row = db.query('SELECT COUNT(*) AS n FROM hub_board_columns')[0];
    if (row && row.n > 0) return;
    for (const column of HubSchema.DEFAULT_COLUMNS) {
      db.run('INSERT INTO hub_board_columns (id, key, title, sort_order, is_done) VALUES (?, ?, ?, ?, ?)',
        `col_${column.key}`, column.key, column.title, column.sort_order, column.is_done);
    }
  }
}

module.exports = HubSchema;
