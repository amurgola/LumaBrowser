const JsonColumn = require('../JsonColumn');

class NetworkWatcherRepository {
  static COLUMNS = {
    urlPattern: 'url_pattern',
    sendTo: 'send_to',
    note: 'note',
    method: 'method',
    enabled: 'enabled',
    triggerCount: 'trigger_count',
    lastTriggered: 'last_triggered',
    captureHeaders: 'capture_headers',
    captureBody: 'capture_body',
    lastCapturedResponse: 'last_captured',
  };
  static BOOLEAN_FIELDS = new Set(['enabled', 'captureHeaders', 'captureBody']);
  static JSON_FIELDS = new Set(['lastCapturedResponse']);

  constructor(db) {
    this._db = db;
  }

  addWatcher(watcher) {
    this._db.prepare(`
      INSERT INTO network_watchers
        (id, url_pattern, send_to, note, method, capture_headers, capture_body, enabled, trigger_count, last_triggered, last_captured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(...NetworkWatcherRepository._insertValues(watcher));
  }

  hasWatcher(urlPattern, method) {
    return !!this._db.prepare('SELECT id FROM network_watchers WHERE url_pattern = ? AND method = ?').get(urlPattern, method || '*');
  }

  updateWatcher(id, data) {
    const fields = Object.keys(NetworkWatcherRepository.COLUMNS).filter((field) => data[field] !== undefined);
    if (fields.length === 0) return;
    const assignments = fields.map((field) => `${NetworkWatcherRepository.COLUMNS[field]} = ?`).join(', ');
    const values = fields.map((field) => NetworkWatcherRepository._columnValue(field, data[field]));
    this._db.prepare(`UPDATE network_watchers SET ${assignments} WHERE id = ?`).run(...values, id);
  }

  removeWatcher(id) {
    return this._db.prepare('DELETE FROM network_watchers WHERE id = ?').run(id).changes > 0;
  }

  getAllWatchers() {
    return this._db.prepare('SELECT * FROM network_watchers').all().map(NetworkWatcherRepository._toWatcher);
  }

  static _insertValues(watcher) {
    return [
      watcher.id,
      watcher.urlPattern,
      watcher.sendTo || null,
      watcher.note || null,
      watcher.method || '*',
      watcher.captureHeaders ? 1 : 0,
      watcher.captureBody ? 1 : 0,
      watcher.enabled ? 1 : 0,
      watcher.triggerCount || 0,
      watcher.lastTriggered || null,
      NetworkWatcherRepository._columnValue('lastCapturedResponse', watcher.lastCapturedResponse),
    ];
  }

  static _columnValue(field, value) {
    if (NetworkWatcherRepository.BOOLEAN_FIELDS.has(field)) return value ? 1 : 0;
    if (NetworkWatcherRepository.JSON_FIELDS.has(field)) return value ? JSON.stringify(value) : null;
    return value;
  }

  static _toWatcher(row) {
    return {
      id: row.id,
      urlPattern: row.url_pattern,
      sendTo: row.send_to,
      note: row.note,
      method: row.method,
      captureHeaders: !!row.capture_headers,
      captureBody: !!row.capture_body,
      enabled: !!row.enabled,
      triggerCount: row.trigger_count,
      lastTriggered: row.last_triggered,
      lastCapturedResponse: row.last_captured ? JsonColumn.parse(row.last_captured, null) : null,
      createdAt: row.created_at,
    };
  }
}

module.exports = NetworkWatcherRepository;
