class PrebuiltRagMeta {
  static TABLE = 'prebuilt_meta';

  static DDL = `
    CREATE TABLE IF NOT EXISTS prebuilt_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `;

  static ensure(db) {
    db.exec(PrebuiltRagMeta.DDL);
  }

  static write(db, entries) {
    PrebuiltRagMeta.ensure(db);
    const upsert = db.prepare('INSERT OR REPLACE INTO prebuilt_meta(key, value) VALUES (?, ?)');
    const writeAll = db.transaction((pairs) => {
      for (const [key, value] of pairs) upsert.run(key, String(value));
    });
    writeAll(Object.entries(entries || {}));
  }

  static read(db) {
    if (!PrebuiltRagMeta.exists(db)) return {};
    const meta = {};
    for (const row of db.prepare('SELECT key, value FROM prebuilt_meta ORDER BY key').all()) meta[row.key] = row.value;
    return meta;
  }

  static exists(db) {
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(PrebuiltRagMeta.TABLE);
    return Boolean(row);
  }
}

module.exports = PrebuiltRagMeta;
