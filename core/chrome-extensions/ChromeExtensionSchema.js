class ChromeExtensionSchema {
  static DDL = `
    CREATE TABLE IF NOT EXISTS chrome_extensions (
      id               TEXT PRIMARY KEY,
      name             TEXT NOT NULL,
      version          TEXT,
      path             TEXT NOT NULL,
      manifest_version INTEGER,
      enabled          INTEGER NOT NULL DEFAULT 1,
      installed_at     INTEGER NOT NULL,
      source           TEXT
    );
  `;

  static ensure(db) {
    db.exec(ChromeExtensionSchema.DDL);
  }
}

module.exports = ChromeExtensionSchema;
