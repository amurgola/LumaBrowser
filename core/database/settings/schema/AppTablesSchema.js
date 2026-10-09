class AppTablesSchema {
  static SQL = `
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS network_watchers (
      id               TEXT PRIMARY KEY,
      url_pattern      TEXT NOT NULL,
      send_to          TEXT,
      note             TEXT,
      method           TEXT DEFAULT '*',
      capture_headers  INTEGER DEFAULT 1,
      capture_body     INTEGER DEFAULT 1,
      enabled          INTEGER DEFAULT 1,
      trigger_count    INTEGER DEFAULT 0,
      last_triggered   TEXT,
      last_captured    TEXT,
      created_at       TEXT DEFAULT (datetime('now')),
      UNIQUE(url_pattern, method)
    );

    DROP TABLE IF EXISTS page_templates;
    DROP TABLE IF EXISTS template_gen_runs;
  `;
}

module.exports = AppTablesSchema;
