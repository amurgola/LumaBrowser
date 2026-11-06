const StoreHandle = require('../database/StoreHandle');

class RecentPlaces {
  static KINDS = Object.freeze(['conversation', 'artifact', 'settings', 'setup', 'setting']);
  static MAX_ROWS = 100;
  static MAX_TEXT = 200;

  static SQL = `
    CREATE TABLE IF NOT EXISTS palette_recent (
      kind       TEXT NOT NULL,
      ref        TEXT NOT NULL,
      title      TEXT NOT NULL DEFAULT '',
      subtitle   TEXT NOT NULL DEFAULT '',
      data       TEXT NOT NULL DEFAULT '{}',
      visited_at INTEGER NOT NULL,
      PRIMARY KEY (kind, ref)
    );
    CREATE INDEX IF NOT EXISTS idx_palette_recent_visited ON palette_recent (visited_at DESC);
  `;

  constructor(settingsDb, { now = () => Date.now() } = {}) {
    this._db = StoreHandle.requireOpen(settingsDb, 'RecentPlaces');
    this._now = now;
    this._db.exec(RecentPlaces.SQL);
    this._upsert = this._db.prepare(`
      INSERT INTO palette_recent (kind, ref, title, subtitle, data, visited_at)
      VALUES (@kind, @ref, @title, @subtitle, @data, @visited_at)
      ON CONFLICT (kind, ref) DO UPDATE SET title = @title, subtitle = @subtitle, data = @data, visited_at = @visited_at`);
    this._list = this._db.prepare('SELECT * FROM palette_recent ORDER BY visited_at DESC LIMIT ?');
    this._delete = this._db.prepare('DELETE FROM palette_recent WHERE kind = ? AND ref = ?');
    this._prune = this._db.prepare(`
      DELETE FROM palette_recent WHERE rowid NOT IN
        (SELECT rowid FROM palette_recent ORDER BY visited_at DESC LIMIT ?)`);
  }

  record(place) {
    const row = RecentPlaces._row(place, this._now());
    if (!row) return false;
    this._upsert.run(row);
    this._prune.run(RecentPlaces.MAX_ROWS);
    return true;
  }

  list(limit = 20) {
    const n = Math.max(1, Math.min(RecentPlaces.MAX_ROWS, Number(limit) || 20));
    return this._list.all(n).map(RecentPlaces._hydrate);
  }

  forget(kind, ref) {
    this._delete.run(String(kind), String(ref));
  }

  static _row(place, now) {
    if (!place || typeof place !== 'object') return null;
    if (!RecentPlaces.KINDS.includes(place.kind)) return null;
    const ref = RecentPlaces._text(place.ref);
    if (!ref) return null;
    let data = '{}';
    try { data = JSON.stringify(place.data && typeof place.data === 'object' ? place.data : {}); } catch (_) {}
    if (data.length > 4000) data = '{}';
    return {
      kind: place.kind,
      ref,
      title: RecentPlaces._text(place.title) || ref,
      subtitle: RecentPlaces._text(place.subtitle),
      data,
      visited_at: now,
    };
  }

  static _text(value) {
    return value == null ? '' : String(value).slice(0, RecentPlaces.MAX_TEXT);
  }

  static _hydrate(row) {
    let data = {};
    try { data = JSON.parse(row.data || '{}'); } catch (_) {}
    return { kind: row.kind, ref: row.ref, title: row.title, subtitle: row.subtitle, data, visitedAt: row.visited_at };
  }
}

module.exports = RecentPlaces;
