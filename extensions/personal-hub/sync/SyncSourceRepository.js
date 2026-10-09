const JsonColumn = require('../../../core/database/JsonColumn');

class SyncSourceRepository {
  static TABLE = null;

  constructor(db) {
    if (!this.constructor.TABLE) throw new Error(`${this.constructor.name} must declare TABLE`);
    this._db = db;
    this._table = this.constructor.TABLE;
  }

  list() {
    return this._db.query(`SELECT * FROM ${this._table} ORDER BY created_at ASC`).map(SyncSourceRepository.hydrate);
  }

  get(id) {
    const row = this._db.query(`SELECT * FROM ${this._table} WHERE id = ?`, id)[0];
    return row ? SyncSourceRepository.hydrate(row) : null;
  }

  due(nowIso) {
    return this._db.query(
      `SELECT * FROM ${this._table} WHERE enabled = 1 AND (next_sync_at IS NULL OR next_sync_at <= ?) ORDER BY next_sync_at ASC`,
      nowIso,
    ).map(SyncSourceRepository.hydrate);
  }

  insert(row) {
    const now = new Date().toISOString();
    this._db.run(
      `INSERT INTO ${this._table} (id, kind, label, ${this._hasColor() ? 'color, ' : ''}config, enabled, interval_ms, next_sync_at, created_at, updated_at)
       VALUES (?, ?, ?, ${this._hasColor() ? '?, ' : ''}?, ?, ?, ?, ?, ?)`,
      ...[row.id, row.kind, row.label, ...(this._hasColor() ? [row.color || ''] : []), JSON.stringify(row.config || {}),
        row.enabled === false ? 0 : 1, row.intervalMs, now, now, now],
    );
    return this.get(row.id);
  }

  update(id, columns) {
    const cols = { ...columns, updated_at: new Date().toISOString() };
    if (cols.config && typeof cols.config === 'object') cols.config = JSON.stringify(cols.config);
    const names = Object.keys(cols);
    this._db.run(`UPDATE ${this._table} SET ${names.map((n) => `${n} = ?`).join(', ')} WHERE id = ?`, ...Object.values(cols), id);
    return this.get(id);
  }

  recordSync(id, { status, error = null, lastSyncAt, nextSyncAt }) {
    this._db.run(
      `UPDATE ${this._table} SET last_status = ?, last_error = ?, last_sync_at = ?, next_sync_at = ?, updated_at = ? WHERE id = ?`,
      status, error, lastSyncAt, nextSyncAt, new Date().toISOString(), id,
    );
  }

  delete(id) {
    return this._db.run(`DELETE FROM ${this._table} WHERE id = ?`, id).changes > 0;
  }

  static hydrate(row) {
    return {
      id: row.id,
      kind: row.kind,
      label: row.label,
      color: row.color || '',
      config: JsonColumn.parse(row.config, {}) || {},
      enabled: !!row.enabled,
      intervalMs: row.interval_ms,
      nextSyncAt: row.next_sync_at,
      lastSyncAt: row.last_sync_at,
      lastStatus: row.last_status,
      lastError: row.last_error,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  _hasColor() {
    return this.constructor.HAS_COLOR === true;
  }
}

module.exports = SyncSourceRepository;
