class SqliteSchema {
  static ensureColumn(db, table, column, ddl) {
    if (SqliteSchema.hasColumn(db, table, column)) return false;
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
    return true;
  }

  static hasColumn(db, table, column) {
    try {
      db.prepare(`SELECT ${column} FROM ${table} LIMIT 0`).run();
      return true;
    } catch (_) {
      return false;
    }
  }
}

module.exports = SqliteSchema;
