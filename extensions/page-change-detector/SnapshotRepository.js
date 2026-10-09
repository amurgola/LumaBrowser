class SnapshotRepository {
  static DEFAULT_PAGE_SIZE = 25;
  static MAX_PAGE_SIZE = 200;

  constructor(db) {
    this._db = db;
  }

  latest(monitorId) {
    return this._db.query(
      'SELECT checksum, checked_at, text_preview FROM page_change_history WHERE monitor_id = ? ORDER BY checked_at DESC LIMIT 1',
      monitorId,
    )[0] || null;
  }

  insert(row) {
    this._db.run(
      'INSERT INTO page_change_history (id, monitor_id, checksum, changed, checked_at, text_length, text_preview, diff_summary) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      row.id, row.monitor_id, row.checksum, row.changed, row.checked_at, row.text_length, row.text_preview, row.diff_summary,
    );
  }

  recent(monitorId, limit = 20) {
    return this._db.query(
      'SELECT * FROM page_change_history WHERE monitor_id = ? ORDER BY checked_at DESC LIMIT ?',
      monitorId, limit,
    );
  }

  paged(monitorId, options = {}) {
    const page = Math.max(0, parseInt(options.page, 10) || 0);
    const pageSize = Math.max(1, Math.min(SnapshotRepository.MAX_PAGE_SIZE, parseInt(options.pageSize, 10) || SnapshotRepository.DEFAULT_PAGE_SIZE));
    const changedOnly = !!options.changedOnly;
    const where = changedOnly ? 'WHERE monitor_id = ? AND changed = 1' : 'WHERE monitor_id = ?';
    const totalRow = this._db.query(`SELECT COUNT(*) AS total FROM page_change_history ${where}`, monitorId)[0];
    const items = this._db.query(
      `SELECT * FROM page_change_history ${where} ORDER BY checked_at DESC LIMIT ? OFFSET ?`,
      monitorId, pageSize, page * pageSize,
    );
    return { items, total: totalRow ? Number(totalRow.total) : 0, page, pageSize, changedOnly };
  }

  deleteForMonitor(monitorId) {
    this._db.run('DELETE FROM page_change_history WHERE monitor_id = ?', monitorId);
  }
}

module.exports = SnapshotRepository;
