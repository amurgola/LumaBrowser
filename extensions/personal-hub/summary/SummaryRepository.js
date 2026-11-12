const JsonColumn = require('../../../core/database/JsonColumn');

class SummaryRepository {
  constructor(db) {
    this._db = db;
  }

  all() {
    const byKey = {};
    for (const row of this._db.query('SELECT * FROM hub_summaries')) byKey[row.context_key] = SummaryRepository.hydrate(row);
    return byKey;
  }

  get(key) {
    const row = this._db.query('SELECT * FROM hub_summaries WHERE context_key = ?', key)[0];
    return row ? SummaryRepository.hydrate(row) : null;
  }

  save(row) {
    const values = [row.signature || '', row.summary ? JSON.stringify(row.summary) : null, row.model || '', row.error || null, new Date().toISOString()];
    if (this.get(row.key)) {
      this._db.run('UPDATE hub_summaries SET signature = ?, summary = ?, model = ?, error = ?, updated_at = ? WHERE context_key = ?', ...values, row.key);
    } else {
      this._db.run('INSERT INTO hub_summaries (signature, summary, model, error, updated_at, context_key) VALUES (?, ?, ?, ?, ?, ?)', ...values, row.key);
    }
    return this.get(row.key);
  }

  delete(key) {
    return this._db.run('DELETE FROM hub_summaries WHERE context_key = ?', key).changes > 0;
  }

  static hydrate(row) {
    return {
      key: row.context_key,
      signature: row.signature || '',
      summary: row.summary ? JsonColumn.parse(row.summary, null) : null,
      model: row.model || '',
      error: row.error || null,
      updatedAt: row.updated_at,
    };
  }
}

module.exports = SummaryRepository;
