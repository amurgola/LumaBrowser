const StoreHandle = require('../database/StoreHandle');
const RecordId = require('../database/RecordId');

class HistoryStore {
  static DAY_MS = 86400000;
  static MAX_LIST = 2000;
  static MAX_SUGGEST = 50;
  static RECENCY_BONUS = 100;
  static RECENCY_WINDOW_DAYS = 30;
  static VISIT_WEIGHT = 2;

  constructor(settingsDb) {
    this._db = StoreHandle.requireOpen(settingsDb, 'HistoryStore');
    this._prepareStatements();
  }

  addVisit({ id, url, title, visitedAt } = {}) {
    const row = {
      id: id || RecordId.create('hist'),
      url,
      title: title || null,
      visited_at: visitedAt || new Date().toISOString(),
    };
    this._insert.run(row);
    return HistoryStore._hydrate(row);
  }

  updateTitle(id, title) {
    return this._updateTitle.run(title || null, id).changes > 0;
  }

  lastVisitedAt(url) {
    const row = this._lastVisitOf.get(url);
    return row ? row.visited_at : null;
  }

  list({ search = '', limit = 200, offset = 0 } = {}) {
    const lim = HistoryStore._clampInt(limit, 1, HistoryStore.MAX_LIST);
    const off = Math.max(0, offset | 0);
    const term = (search || '').trim();
    const rows = term
      ? this._listMatching.all(`%${term}%`, `%${term}%`, lim, off)
      : this._listAll.all(lim, off);
    return rows.map(HistoryStore._hydrate);
  }

  suggest(query, { limit = 8, scan = 50 } = {}) {
    const q = (query || '').trim();
    if (!q) return [];
    const now = Date.now();
    const scored = this._suggest.all({ q: `%${q}%`, scan }).map((row) => HistoryStore._scoreSuggestion(row, now));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, HistoryStore._clampInt(limit, 1, HistoryStore.MAX_SUGGEST));
  }

  deleteById(id) {
    return this._deleteById.run(id).changes > 0;
  }

  deleteByUrl(url) {
    return this._deleteByUrl.run(url).changes;
  }

  clear({ before, since } = {}) {
    if (since) return this._deleteSince.run(since).changes;
    if (before) return this._deleteBefore.run(before).changes;
    return this._deleteAll.run().changes;
  }

  _prepareStatements() {
    this._insert = this._db.prepare(`
      INSERT INTO browser_history (id, url, title, visited_at)
      VALUES (@id, @url, @title, @visited_at)
    `);
    this._lastVisitOf = this._db.prepare(
      'SELECT visited_at FROM browser_history WHERE url = ? ORDER BY visited_at DESC, rowid DESC LIMIT 1'
    );
    this._updateTitle = this._db.prepare('UPDATE browser_history SET title = ? WHERE id = ?');
    this._deleteById = this._db.prepare('DELETE FROM browser_history WHERE id = ?');
    this._deleteByUrl = this._db.prepare('DELETE FROM browser_history WHERE url = ?');
    this._deleteBefore = this._db.prepare('DELETE FROM browser_history WHERE visited_at < ?');
    this._deleteSince = this._db.prepare('DELETE FROM browser_history WHERE visited_at >= ?');
    this._deleteAll = this._db.prepare('DELETE FROM browser_history');
    this._listAll = this._db.prepare(
      'SELECT * FROM browser_history ORDER BY visited_at DESC, rowid DESC LIMIT ? OFFSET ?'
    );
    this._listMatching = this._db.prepare(`
      SELECT * FROM browser_history
      WHERE url LIKE ? OR title LIKE ?
      ORDER BY visited_at DESC, rowid DESC
      LIMIT ? OFFSET ?
    `);
    this._suggest = this._db.prepare(`
      SELECT
        url,
        COUNT(*)            AS visit_count,
        MAX(visited_at)     AS last_visited_at,
        (SELECT title FROM browser_history h2
           WHERE h2.url = h1.url AND h2.title IS NOT NULL AND h2.title != ''
           ORDER BY h2.visited_at DESC LIMIT 1) AS title
      FROM browser_history h1
      WHERE url LIKE @q OR title LIKE @q
      GROUP BY url
      ORDER BY visit_count DESC, last_visited_at DESC
      LIMIT @scan
    `);
  }

  static _scoreSuggestion(row, now) {
    const last = Date.parse(row.last_visited_at) || 0;
    const ageDays = Math.max(0, (now - last) / HistoryStore.DAY_MS);
    const recencyBonus = Math.max(0, HistoryStore.RECENCY_BONUS * (1 - ageDays / HistoryStore.RECENCY_WINDOW_DAYS));
    return {
      url: row.url,
      title: row.title || null,
      visitCount: row.visit_count,
      lastVisitedAt: row.last_visited_at,
      score: row.visit_count * HistoryStore.VISIT_WEIGHT + recencyBonus,
    };
  }

  static _clampInt(value, min, max) {
    return Math.min(Math.max(min, value | 0), max);
  }

  static _hydrate(row) {
    return { id: row.id, url: row.url, title: row.title, visitedAt: row.visited_at };
  }
}

module.exports = HistoryStore;
