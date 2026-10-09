class TriggerVersionRepository {
  constructor(db) {
    this._insert = db.prepare(`
      INSERT INTO llm_trigger_versions (id, trigger_id, n, at, origin, action, config_hash, tested, test_at, test_run_id, was_armed, note)
      VALUES (@id, @trigger_id, @n, @at, @origin, @action, @config_hash, @tested, @test_at, @test_run_id, @was_armed, @note)
    `);
    this._list = db.prepare('SELECT * FROM llm_trigger_versions WHERE trigger_id = ? ORDER BY n DESC');
    this._latest = db.prepare('SELECT * FROM llm_trigger_versions WHERE trigger_id = ? ORDER BY n DESC LIMIT 1');
    this._get = db.prepare('SELECT * FROM llm_trigger_versions WHERE trigger_id = ? AND n = ?');
    this._setWasArmed = db.prepare('UPDATE llm_trigger_versions SET was_armed = ? WHERE id = ?');
    this._markTested = db.prepare(
      'UPDATE llm_trigger_versions SET tested = 1, test_at = ?, test_run_id = ? WHERE trigger_id = ? AND config_hash = ?',
    );
    this._prune = db.prepare(`
      DELETE FROM llm_trigger_versions WHERE trigger_id = ? AND n NOT IN (
        SELECT n FROM llm_trigger_versions WHERE trigger_id = ? ORDER BY n DESC LIMIT ?
      )
    `);
    this._deleteForTrigger = db.prepare('DELETE FROM llm_trigger_versions WHERE trigger_id = ?');
  }

  insert(row) { this._insert.run(row); }
  list(triggerId) { return this._list.all(triggerId); }
  latest(triggerId) { return this._latest.get(triggerId) || null; }
  get(triggerId, n) { return this._get.get(triggerId, n) || null; }
  setWasArmed(id, wasArmed) { this._setWasArmed.run(wasArmed, id); }
  markTested(triggerId, configHash, testAt, testRunId) { this._markTested.run(testAt, testRunId, triggerId, configHash); }
  prune(triggerId, keep) { this._prune.run(triggerId, triggerId, keep); }
  deleteForTrigger(triggerId) { this._deleteForTrigger.run(triggerId); }
}

module.exports = TriggerVersionRepository;
