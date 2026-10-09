const JsonColumn = require('../../../core/database/JsonColumn');

class NotificationRepository {
  constructor(db) {
    this._db = db;
  }

  insert(row) {
    this._db.run(
      `INSERT INTO hub_notifications (id, received_at, app, host, partition, tab_title, title, body, url, tag, sender, thread_key, thread_id, dedupe_key, data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      row.id, row.receivedAt, row.app || '', row.host || '', row.partition || '', row.tabTitle || '', row.title || '', row.body || '',
      row.url || '', row.tag || '', row.sender || '', row.threadKey || '', row.threadId || null, row.dedupeKey || '',
      row.data == null ? null : JSON.stringify(row.data),
    );
    return this.get(row.id);
  }

  get(id) {
    const row = this._db.query('SELECT * FROM hub_notifications WHERE id = ?', id)[0];
    return row ? NotificationRepository.hydrate(row) : null;
  }

  hasDedupe(dedupeKey, sinceIso) {
    if (!dedupeKey) return false;
    const row = this._db.query('SELECT 1 AS ok FROM hub_notifications WHERE dedupe_key = ? AND received_at >= ? LIMIT 1', dedupeKey, sinceIso)[0];
    return !!row;
  }

  listForThread(threadId, { limit = 50 } = {}) {
    return this._db.query('SELECT * FROM hub_notifications WHERE thread_id = ? ORDER BY received_at DESC LIMIT ?', threadId, limit)
      .map(NotificationRepository.hydrate);
  }

  listRecent({ limit = 100, offset = 0, app = null, since = null } = {}) {
    const where = [];
    const params = [];
    if (app) { where.push('app = ?'); params.push(app); }
    if (since) { where.push('received_at >= ?'); params.push(since); }
    const sql = `SELECT * FROM hub_notifications${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY received_at DESC LIMIT ? OFFSET ?`;
    return this._db.query(sql, ...params, limit, offset).map(NotificationRepository.hydrate);
  }

  count() {
    const row = this._db.query('SELECT COUNT(*) AS n FROM hub_notifications')[0];
    return (row && row.n) || 0;
  }

  pruneBefore(beforeIso) {
    return this._db.run('DELETE FROM hub_notifications WHERE received_at < ?', beforeIso).changes;
  }

  static hydrate(row) {
    return {
      id: row.id,
      receivedAt: row.received_at,
      app: row.app,
      host: row.host,
      partition: row.partition || '',
      tabTitle: row.tab_title || '',
      title: row.title,
      body: row.body,
      url: row.url || '',
      tag: row.tag || '',
      sender: row.sender || '',
      threadKey: row.thread_key,
      threadId: row.thread_id,
      dedupeKey: row.dedupe_key,
      data: row.data == null ? null : JsonColumn.parse(row.data, null),
    };
  }
}

module.exports = NotificationRepository;
