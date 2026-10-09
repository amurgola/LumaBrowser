const JsonColumn = require('../../../core/database/JsonColumn');

class ThreadRepository {
  static STATES = ['open', 'reviewed', 'snoozed', 'done'];
  static PRIORITIES = ['low', 'normal', 'high', 'urgent'];

  constructor(db) {
    this._db = db;
  }

  get(id) {
    const row = this._db.query('SELECT * FROM hub_threads WHERE id = ?', id)[0];
    return row ? ThreadRepository.hydrate(row) : null;
  }

  findByKey(app, threadKey) {
    const row = this._db.query('SELECT * FROM hub_threads WHERE app = ? AND thread_key = ?', app, threadKey)[0];
    return row ? ThreadRepository.hydrate(row) : null;
  }

  insert(row) {
    this._db.run(
      `INSERT INTO hub_threads (id, app, thread_key, title, participants, first_at, last_at, count, state, priority, summary, labels, context, url, task_id, snooze_until, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      row.id, row.app, row.threadKey, row.title || '', JSON.stringify(row.participants || []), row.firstAt, row.lastAt, row.count || 0,
      row.state || 'open', row.priority || 'normal', row.summary || '', JSON.stringify(row.labels || []), JSON.stringify(row.context || {}),
      row.url || '', row.taskId || null, row.snoozeUntil || null, new Date().toISOString(),
    );
    return this.get(row.id);
  }

  update(id, columns) {
    const cols = { ...columns, updated_at: new Date().toISOString() };
    for (const key of ['participants', 'labels', 'context']) {
      if (cols[key] !== undefined && typeof cols[key] !== 'string') cols[key] = JSON.stringify(cols[key]);
    }
    const names = Object.keys(cols);
    this._db.run(`UPDATE hub_threads SET ${names.map((n) => `${n} = ?`).join(', ')} WHERE id = ?`, ...Object.values(cols), id);
    return this.get(id);
  }

  list({ state = 'open', app = null, limit = 100, offset = 0, nowIso = new Date().toISOString() } = {}) {
    const where = [];
    const params = [];
    if (state === 'open') {
      where.push("(state = 'open' OR (state = 'snoozed' AND snooze_until IS NOT NULL AND snooze_until <= ?))");
      params.push(nowIso);
    } else if (state && state !== 'all') {
      where.push('state = ?');
      params.push(state);
    }
    if (app) {
      where.push('app = ?');
      params.push(app);
    }
    const sql = `SELECT * FROM hub_threads${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY last_at DESC LIMIT ? OFFSET ?`;
    return this._db.query(sql, ...params, limit, offset).map(ThreadRepository.hydrate);
  }

  countByState() {
    const counts = {};
    for (const row of this._db.query('SELECT state, COUNT(*) AS n FROM hub_threads GROUP BY state')) counts[row.state] = row.n;
    return counts;
  }

  delete(id) {
    return this._db.run('DELETE FROM hub_threads WHERE id = ?', id).changes > 0;
  }

  static hydrate(row) {
    return {
      id: row.id,
      app: row.app,
      threadKey: row.thread_key,
      title: row.title,
      participants: JsonColumn.parse(row.participants, []) || [],
      firstAt: row.first_at,
      lastAt: row.last_at,
      count: row.count,
      state: row.state,
      priority: row.priority,
      summary: row.summary || '',
      labels: JsonColumn.parse(row.labels, []) || [],
      context: JsonColumn.parse(row.context, {}) || {},
      url: row.url || '',
      taskId: row.task_id,
      snoozeUntil: row.snooze_until,
      updatedAt: row.updated_at,
    };
  }
}

module.exports = ThreadRepository;
