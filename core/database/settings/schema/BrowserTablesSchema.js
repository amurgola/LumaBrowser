class BrowserTablesSchema {
  static SQL = `
    CREATE TABLE IF NOT EXISTS browser_history (
      id         TEXT PRIMARY KEY,
      url        TEXT NOT NULL,
      title      TEXT,
      visited_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_history_visited_at
      ON browser_history (visited_at DESC);

    CREATE INDEX IF NOT EXISTS idx_history_url
      ON browser_history (url);

    CREATE TABLE IF NOT EXISTS bookmarks (
      id              TEXT PRIMARY KEY,
      parent_id       TEXT,
      type            TEXT NOT NULL DEFAULT 'bookmark',
      title           TEXT,
      url             TEXT,
      position        INTEGER NOT NULL DEFAULT 0,
      open_on_startup INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_bookmarks_parent
      ON bookmarks (parent_id, position);
  `;
}

module.exports = BrowserTablesSchema;
