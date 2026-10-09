const fs = require('fs');
const path = require('path');

class SqliteOpener {
  static DEFAULT_BUSY_TIMEOUT_MS = 5000;
  static MEMORY_PATH = ':memory:';

  static open(dbPath, { busyTimeoutMs = SqliteOpener.DEFAULT_BUSY_TIMEOUT_MS, mkdir = false, readOnly = false } = {}) {
    SqliteOpener._requirePath(dbPath);
    if (readOnly) return SqliteOpener._construct(dbPath, busyTimeoutMs, { readonly: true, fileMustExist: true });
    if (mkdir) SqliteOpener._ensureParentDirectory(dbPath);
    const db = SqliteOpener._construct(dbPath, busyTimeoutMs);
    db.pragma('journal_mode = WAL');
    return db;
  }

  static _requirePath(dbPath) {
    if (!dbPath) throw new Error('SqliteOpener.open: a dbPath is required');
  }

  static _ensureParentDirectory(dbPath) {
    if (dbPath === SqliteOpener.MEMORY_PATH) return;
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  static _construct(dbPath, busyTimeoutMs, options = {}) {
    const Database = require('better-sqlite3');
    return new Database(dbPath, { timeout: Number(busyTimeoutMs), ...options });
  }
}

module.exports = SqliteOpener;
