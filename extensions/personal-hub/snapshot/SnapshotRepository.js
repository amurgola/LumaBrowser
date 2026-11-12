class SnapshotRepository {
  constructor(db) {
    this._db = db;
  }

  get(threadId) {
    const row = this._db.query('SELECT * FROM hub_snapshots WHERE thread_id = ?', threadId)[0];
    return row ? SnapshotRepository.hydrate(row) : null;
  }

  forThreads(threadIds) {
    const ids = [...new Set((threadIds || []).filter(Boolean).map(String))];
    if (!ids.length) return {};
    const found = {};
    const rows = this._db.query(`SELECT * FROM hub_snapshots WHERE thread_id IN (${ids.map(() => '?').join(', ')})`, ...ids);
    for (const row of rows) found[row.thread_id] = SnapshotRepository.hydrate(row);
    return found;
  }

  save(row) {
    const values = [row.scope || '', row.url || '', row.text || '', row.sourceAt || '', new Date().toISOString()];
    if (this.get(row.threadId)) {
      this._db.run('UPDATE hub_snapshots SET scope = ?, url = ?, text = ?, source_at = ?, taken_at = ? WHERE thread_id = ?', ...values, row.threadId);
    } else {
      this._db.run('INSERT INTO hub_snapshots (scope, url, text, source_at, taken_at, thread_id) VALUES (?, ?, ?, ?, ?, ?)', ...values, row.threadId);
    }
    return this.get(row.threadId);
  }

  delete(threadId) {
    return this._db.run('DELETE FROM hub_snapshots WHERE thread_id = ?', threadId).changes > 0;
  }

  static hydrate(row) {
    return { threadId: row.thread_id, scope: row.scope || '', url: row.url || '', text: row.text || '', sourceAt: row.source_at || '', takenAt: row.taken_at };
  }
}

module.exports = SnapshotRepository;
