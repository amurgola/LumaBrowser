class MonitorSchema {
  static MONITORS_TABLE = `CREATE TABLE IF NOT EXISTS page_change_monitors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      check_interval_ms INTEGER NOT NULL DEFAULT 300000,
      status TEXT DEFAULT 'idle',
      last_status TEXT,
      last_error TEXT,
      next_run TEXT,
      webhook_url TEXT DEFAULT '',
      desktop_notifications INTEGER DEFAULT 1,
      enabled INTEGER DEFAULT 1,
      no_refresh_required INTEGER DEFAULT 0,
      interval_jitter_percent INTEGER DEFAULT 0,
      selectors TEXT,
      last_run TEXT,
      last_checksum TEXT,
      change_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`;

  static HISTORY_TABLE = `CREATE TABLE IF NOT EXISTS page_change_history (
      id TEXT PRIMARY KEY,
      monitor_id TEXT NOT NULL,
      checksum TEXT NOT NULL,
      changed INTEGER DEFAULT 0,
      checked_at TEXT NOT NULL,
      text_length INTEGER DEFAULT 0,
      text_preview TEXT DEFAULT '',
      diff_summary TEXT,
      FOREIGN KEY (monitor_id) REFERENCES page_change_monitors(id)
    )`;

  static ADDED_COLUMNS = [
    'ALTER TABLE page_change_history ADD COLUMN text_preview TEXT DEFAULT ""',
    'ALTER TABLE page_change_history ADD COLUMN diff_summary TEXT',
    'ALTER TABLE page_change_monitors ADD COLUMN no_refresh_required INTEGER DEFAULT 0',
    'ALTER TABLE page_change_monitors ADD COLUMN interval_jitter_percent INTEGER DEFAULT 0',
    'ALTER TABLE page_change_monitors ADD COLUMN selectors TEXT',
    "ALTER TABLE page_change_monitors ADD COLUMN status TEXT DEFAULT 'idle'",
    'ALTER TABLE page_change_monitors ADD COLUMN last_status TEXT',
    'ALTER TABLE page_change_monitors ADD COLUMN last_error TEXT',
    'ALTER TABLE page_change_monitors ADD COLUMN next_run TEXT',
  ];

  static ensure(db) {
    db.run(MonitorSchema.MONITORS_TABLE);
    db.run(MonitorSchema.HISTORY_TABLE);
    MonitorSchema._addMissingColumns(db);
    db.run("UPDATE page_change_monitors SET status = 'idle' WHERE status = 'checking'");
  }

  static _addMissingColumns(db) {
    for (const sql of MonitorSchema.ADDED_COLUMNS) {
      try { db.run(sql); } catch (_) {}
    }
  }
}

module.exports = MonitorSchema;
