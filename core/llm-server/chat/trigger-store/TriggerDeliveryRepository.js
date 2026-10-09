class TriggerDeliveryRepository {
  constructor(db) {
    this._insert = db.prepare(`
      INSERT INTO llm_trigger_deliveries (id, trigger_id, at, source, outcome, detail, run_id, dedupe_key, remote, event)
      VALUES (@id, @trigger_id, @at, @source, @outcome, @detail, @run_id, @dedupe_key, @remote, @event)
    `);
    this._update = db.prepare(
      'UPDATE llm_trigger_deliveries SET outcome = ?, detail = COALESCE(?, detail), run_id = COALESCE(?, run_id) WHERE id = ?',
    );
    this._get = db.prepare('SELECT * FROM llm_trigger_deliveries WHERE id = ?');
    this._list = db.prepare('SELECT * FROM llm_trigger_deliveries WHERE trigger_id = ? ORDER BY at DESC, rowid DESC LIMIT ? OFFSET ?');
    this._counts = db.prepare('SELECT outcome, COUNT(*) AS n FROM llm_trigger_deliveries WHERE trigger_id = ? GROUP BY outcome');
    this._prune = db.prepare(`
      DELETE FROM llm_trigger_deliveries WHERE trigger_id = ? AND rowid NOT IN (
        SELECT rowid FROM llm_trigger_deliveries WHERE trigger_id = ? ORDER BY at DESC, rowid DESC LIMIT ?
      )
    `);
    this._deleteForTrigger = db.prepare('DELETE FROM llm_trigger_deliveries WHERE trigger_id = ?');
  }

  insert(row) { this._insert.run(row); }
  update(id, outcome, detail, runId) { this._update.run(outcome, detail, runId, id); }
  get(id) { return this._get.get(id) || null; }
  list(triggerId, limit, offset) { return this._list.all(triggerId, limit, offset); }
  counts(triggerId) { return this._counts.all(triggerId); }
  prune(triggerId, keep) { this._prune.run(triggerId, triggerId, keep); }
  deleteForTrigger(triggerId) { this._deleteForTrigger.run(triggerId); }
}

module.exports = TriggerDeliveryRepository;
