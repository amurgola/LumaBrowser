const SqliteOpener = require('../database/SqliteOpener');
const JsonColumn = require('../database/JsonColumn');

class ActivityLogStore {
  static DEFAULT_LIMIT = 200;
  static MAX_LIMIT = 1000;

  constructor(dbPath) {
    this._db = SqliteOpener.open(dbPath);
    this._createSchema();
    this._prepareStatements();
  }

  insert(entry) {
    return this._insert.run(ActivityLogStore._toRow(entry)).lastInsertRowid;
  }

  update(id, patch) {
    const existing = this._getById.get(id);
    if (!existing) return false;
    this._update.run(ActivityLogStore._mergePatch(id, existing, patch));
    return true;
  }

  getById(id) {
    const row = this._getById.get(id);
    return row ? ActivityLogStore._hydrate(row) : null;
  }

  getChildren(parentId) {
    return this._getChildren.all(parentId).map(ActivityLogStore._hydrate);
  }

  getByCorrelation(correlation) {
    return this._getByCorrelation.all(correlation).map(ActivityLogStore._hydrate);
  }

  query(filter = {}) {
    const { where, params } = ActivityLogStore._whereFor(filter);
    const limit = Math.min(filter.limit ?? ActivityLogStore.DEFAULT_LIMIT, ActivityLogStore.MAX_LIMIT);
    const offset = filter.offset ?? 0;
    const sql = `SELECT * FROM activity_log ${where} ORDER BY ts_start DESC LIMIT ? OFFSET ?`;
    return this._db.prepare(sql).all(...params, limit, offset).map(ActivityLogStore._hydrate);
  }

  distinctCallers() {
    return this._distinctCallers.all().map((row) => row.caller);
  }

  count() {
    return this._countAll.get().n;
  }

  clear() {
    this._deleteAll.run();
  }

  prune({ maxAgeMs, maxRows }) {
    return this._pruneByAge(maxAgeMs) + this._pruneByCount(maxRows);
  }

  close() {
    this._db.close();
  }

  _pruneByAge(maxAgeMs) {
    if (!(maxAgeMs > 0)) return 0;
    return this._deleteBefore.run(Date.now() - maxAgeMs).changes;
  }

  _pruneByCount(maxRows) {
    if (!(maxRows > 0)) return 0;
    const { n } = this._countAll.get();
    return n > maxRows ? this._deleteOldest.run(n - maxRows).changes : 0;
  }

  _createSchema() {
    this._db.exec(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        ts_start     INTEGER NOT NULL,
        ts_end       INTEGER,
        duration_ms  INTEGER,
        caller       TEXT NOT NULL,
        action       TEXT NOT NULL,
        result       TEXT,
        summary      TEXT,
        tab_id       INTEGER,
        url          TEXT,
        correlation  TEXT,
        parent_id    INTEGER,
        details      TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_activity_ts          ON activity_log(ts_start DESC);
      CREATE INDEX IF NOT EXISTS idx_activity_caller      ON activity_log(caller, ts_start DESC);
      CREATE INDEX IF NOT EXISTS idx_activity_correlation ON activity_log(correlation);
      CREATE INDEX IF NOT EXISTS idx_activity_parent      ON activity_log(parent_id);
    `);
  }

  _prepareStatements() {
    this._insert = this._db.prepare(`
      INSERT INTO activity_log
        (ts_start, ts_end, duration_ms, caller, action, result, summary, tab_id, url, correlation, parent_id, details)
      VALUES
        (@ts_start, @ts_end, @duration_ms, @caller, @action, @result, @summary, @tab_id, @url, @correlation, @parent_id, @details)
    `);
    this._update = this._db.prepare(`
      UPDATE activity_log
      SET ts_end = @ts_end, duration_ms = @duration_ms, result = @result, summary = @summary, details = @details
      WHERE id = @id
    `);
    this._getById = this._db.prepare('SELECT * FROM activity_log WHERE id = ?');
    this._getChildren = this._db.prepare('SELECT * FROM activity_log WHERE parent_id = ? ORDER BY ts_start ASC');
    this._getByCorrelation = this._db.prepare('SELECT * FROM activity_log WHERE correlation = ? ORDER BY ts_start ASC');
    this._deleteAll = this._db.prepare('DELETE FROM activity_log');
    this._deleteBefore = this._db.prepare('DELETE FROM activity_log WHERE ts_start < ?');
    this._countAll = this._db.prepare('SELECT COUNT(*) AS n FROM activity_log');
    this._deleteOldest = this._db.prepare(
      'DELETE FROM activity_log WHERE id IN (SELECT id FROM activity_log ORDER BY ts_start ASC LIMIT ?)'
    );
    this._distinctCallers = this._db.prepare('SELECT DISTINCT caller FROM activity_log ORDER BY caller ASC');
  }

  static _whereFor(filter) {
    const clauses = [];
    const params = [];
    const add = (clause, ...values) => { clauses.push(clause); params.push(...values); };
    if (filter.caller) add('caller = ?', filter.caller);
    if (filter.result) add('result = ?', filter.result);
    if (filter.since) add('ts_start >= ?', filter.since);
    if (filter.until) add('ts_start <= ?', filter.until);
    if (filter.correlation) add('correlation = ?', filter.correlation);
    if (filter.search) {
      const pattern = `%${filter.search}%`;
      add('(summary LIKE ? OR action LIKE ? OR details LIKE ?)', pattern, pattern, pattern);
    }
    if (filter.topLevelOnly !== false) add('parent_id IS NULL');
    return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
  }

  static _toRow(entry) {
    return {
      ts_start: entry.tsStart,
      ts_end: entry.tsEnd ?? null,
      duration_ms: entry.durationMs ?? null,
      caller: entry.caller,
      action: entry.action,
      result: entry.result ?? null,
      summary: entry.summary ?? null,
      tab_id: entry.tabId ?? null,
      url: entry.url ?? null,
      correlation: entry.correlation ?? null,
      parent_id: entry.parentId ?? null,
      details: ActivityLogStore._serializeDetails(entry.details),
    };
  }

  static _mergePatch(id, existing, patch) {
    const pick = (key, column) => (patch[key] !== undefined ? patch[key] : existing[column]);
    return {
      id,
      ts_end: pick('tsEnd', 'ts_end'),
      duration_ms: pick('durationMs', 'duration_ms'),
      result: pick('result', 'result'),
      summary: pick('summary', 'summary'),
      details: patch.details !== undefined ? ActivityLogStore._serializeDetails(patch.details) : existing.details,
    };
  }

  static _serializeDetails(details) {
    return details != null ? JSON.stringify(details) : null;
  }

  static _hydrate(row) {
    return {
      id: row.id,
      tsStart: row.ts_start,
      tsEnd: row.ts_end,
      durationMs: row.duration_ms,
      caller: row.caller,
      action: row.action,
      result: row.result,
      summary: row.summary,
      tabId: row.tab_id,
      url: row.url,
      correlation: row.correlation,
      parentId: row.parent_id,
      details: row.details ? JsonColumn.parse(row.details, (raw) => ({ _raw: raw })) : null,
    };
  }
}

module.exports = ActivityLogStore;
