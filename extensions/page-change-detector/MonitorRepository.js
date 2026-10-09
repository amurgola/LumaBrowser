class MonitorRepository {
  constructor(db) {
    this._db = db;
  }

  all() {
    return this._db.query('SELECT * FROM page_change_monitors ORDER BY created_at DESC').map(MonitorRepository._deserialize);
  }

  get(id) {
    const rows = this._db.query('SELECT * FROM page_change_monitors WHERE id = ?', id);
    return rows[0] ? MonitorRepository._deserialize(rows[0]) : null;
  }

  insert(row) {
    this._db.run(
      'INSERT INTO page_change_monitors (id, name, url, check_interval_ms, webhook_url, desktop_notifications, enabled, no_refresh_required, interval_jitter_percent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      row.id, row.name, row.url, row.check_interval_ms, row.webhook_url,
      row.desktop_notifications, row.enabled, row.no_refresh_required, row.interval_jitter_percent,
    );
  }

  update(id, columns) {
    const names = Object.keys(columns);
    if (!names.length) return;
    this._db.run(`UPDATE page_change_monitors SET ${names.map((n) => `${n} = ?`).join(', ')} WHERE id = ?`,
      ...Object.values(columns), id);
  }

  recordRead(id, { checkedAt, checksum }) {
    this._db.run(
      'UPDATE page_change_monitors SET last_run = ?, last_checksum = ?, last_status = ?, last_error = NULL WHERE id = ?',
      checkedAt, checksum, 'ok', id,
    );
  }

  changeCount(id) {
    const row = this._db.query('SELECT change_count FROM page_change_monitors WHERE id = ?', id)[0];
    return (row && row.change_count) || 0;
  }

  incrementChangeCount(id) {
    this._db.run('UPDATE page_change_monitors SET change_count = change_count + 1 WHERE id = ?', id);
  }

  delete(id) {
    return this._db.run('DELETE FROM page_change_monitors WHERE id = ?', id).changes > 0;
  }

  static _deserialize(row) {
    return { ...row, selectors: MonitorRepository._parseSelectors(row.selectors) };
  }

  static _parseSelectors(json) {
    if (!json) return null;
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = MonitorRepository;
