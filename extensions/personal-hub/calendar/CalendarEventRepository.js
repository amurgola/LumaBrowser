const JsonColumn = require('../../../core/database/JsonColumn');
const RecordId = require('../../../core/database/RecordId');

class CalendarEventRepository {
  static ID_PREFIX = 'cev';

  constructor(db) {
    this._db = db;
  }

  replaceForSource(sourceId, events) {
    const raw = this._db.getRawDb().db;
    const run = raw.transaction(() => {
      this.deleteForSource(sourceId);
      for (const event of events) this._insert(sourceId, event);
    });
    run();
    return events.length;
  }

  deleteForSource(sourceId) {
    this._db.run('DELETE FROM hub_calendar_events WHERE source_id = ?', sourceId);
  }

  listBetween(fromIso, toIso, { sourceIds = null, limit = 500 } = {}) {
    const params = [toIso, fromIso];
    let filter = '';
    if (Array.isArray(sourceIds) && sourceIds.length) {
      filter = ` AND source_id IN (${sourceIds.map(() => '?').join(', ')})`;
      params.push(...sourceIds);
    }
    return this._db.query(
      `SELECT * FROM hub_calendar_events WHERE starts_at < ? AND COALESCE(ends_at, starts_at) >= ?${filter} ORDER BY starts_at ASC, title ASC LIMIT ?`,
      ...params, limit,
    ).map(CalendarEventRepository.hydrate);
  }

  countForSource(sourceId) {
    const row = this._db.query('SELECT COUNT(*) AS n FROM hub_calendar_events WHERE source_id = ?', sourceId)[0];
    return (row && row.n) || 0;
  }

  _insert(sourceId, e) {
    this._db.run(
      `INSERT OR REPLACE INTO hub_calendar_events (id, source_id, uid, title, description, location, starts_at, ends_at, all_day, status, url, organizer, attendees, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      RecordId.create(CalendarEventRepository.ID_PREFIX), sourceId, String(e.uid || ''), e.title || '', e.description || '', e.location || '',
      e.startsAt, e.endsAt || null, e.allDay ? 1 : 0, e.status || '', e.url || '', e.organizer || '',
      JSON.stringify(Array.isArray(e.attendees) ? e.attendees : []), new Date().toISOString(),
    );
  }

  static hydrate(row) {
    return {
      id: row.id,
      sourceId: row.source_id,
      uid: row.uid,
      title: row.title,
      description: row.description || '',
      location: row.location || '',
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      allDay: !!row.all_day,
      status: row.status || '',
      url: row.url || '',
      organizer: row.organizer || '',
      attendees: JsonColumn.parse(row.attendees, []) || [],
      updatedAt: row.updated_at,
    };
  }
}

module.exports = CalendarEventRepository;
