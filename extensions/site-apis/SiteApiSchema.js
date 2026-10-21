class SiteApiSchema {
  static SITES_TABLE = `CREATE TABLE IF NOT EXISTS site_api_sites (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      origin TEXT NOT NULL,
      partition TEXT NOT NULL,
      start_url TEXT NOT NULL,
      login TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'unknown',
      status_note TEXT,
      conversation_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`;

  static ENDPOINTS_TABLE = `CREATE TABLE IF NOT EXISTS site_api_endpoints (
      id TEXT PRIMARY KEY,
      site_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      params TEXT NOT NULL DEFAULT '[]',
      steps TEXT NOT NULL DEFAULT '[]',
      returns TEXT NOT NULL DEFAULT '{}',
      policy TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'draft',
      last_run TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (site_id, name)
    )`;

  static RUNS_TABLE = `CREATE TABLE IF NOT EXISTS site_api_runs (
      id TEXT PRIMARY KEY,
      endpoint_id TEXT NOT NULL,
      site_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      params TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL,
      fault TEXT,
      result TEXT,
      steps_log TEXT,
      duration_ms INTEGER,
      started_at TEXT NOT NULL,
      finished_at TEXT
    )`;

  static RUNS_INDEX = 'CREATE INDEX IF NOT EXISTS site_api_runs_endpoint ON site_api_runs (endpoint_id, started_at)';

  static ADDED_COLUMNS = [];

  static ensure(db) {
    db.run(SiteApiSchema.SITES_TABLE);
    db.run(SiteApiSchema.ENDPOINTS_TABLE);
    db.run(SiteApiSchema.RUNS_TABLE);
    db.run(SiteApiSchema.RUNS_INDEX);
    SiteApiSchema._addMissingColumns(db);
    db.run("UPDATE site_api_runs SET status = 'failed', fault = '{\"code\":\"aborted\",\"message\":\"The app closed during the run\"}' WHERE status = 'running'");
  }

  static _addMissingColumns(db) {
    for (const sql of SiteApiSchema.ADDED_COLUMNS) {
      try { db.run(sql); } catch (_) {}
    }
  }
}

module.exports = SiteApiSchema;
