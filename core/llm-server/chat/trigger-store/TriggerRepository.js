class TriggerRepository {
  constructor(db) {
    this._insert = db.prepare(`
      INSERT INTO llm_triggers
        (id, conversation_id, title, kind, hook_token, source, action, sample, last_test,
         enabled, fire_count, last_fired_at, last_status, created_at, updated_at)
      VALUES
        (@id, @conversation_id, @title, @kind, @hook_token, @source, @action, @sample, @last_test,
         @enabled, @fire_count, @last_fired_at, @last_status, @created_at, @updated_at)
    `);
    this._get = db.prepare('SELECT * FROM llm_triggers WHERE id = ?');
    this._getByToken = db.prepare('SELECT * FROM llm_triggers WHERE hook_token = ?');
    this._list = db.prepare('SELECT * FROM llm_triggers ORDER BY created_at DESC');
    this._listWithRunCounts = db.prepare(`
      SELECT t.*, (SELECT COUNT(*) FROM llm_trigger_runs r WHERE r.trigger_id = t.id) AS run_count
      FROM llm_triggers t
      ORDER BY t.created_at DESC
    `);
    this._listByConversation = db.prepare('SELECT * FROM llm_triggers WHERE conversation_id = ? ORDER BY created_at ASC');
    this._delete = db.prepare('DELETE FROM llm_triggers WHERE id = ?');
    this._updateConfig = db.prepare(`
      UPDATE llm_triggers
      SET title = @title, source = @source, action = @action, enabled = @enabled, updated_at = @updated_at,
          paused_reason = CASE WHEN @clear_pause THEN NULL ELSE paused_reason END,
          consecutive_failures = CASE WHEN @clear_pause THEN 0 ELSE consecutive_failures END
      WHERE id = @id
    `);
    this._restoreTest = db.prepare(`
      UPDATE llm_triggers
      SET last_test = @last_test, enabled = @enabled, updated_at = @updated_at,
          paused_reason = CASE WHEN @clear_pause THEN NULL ELSE paused_reason END,
          consecutive_failures = CASE WHEN @clear_pause THEN 0 ELSE consecutive_failures END
      WHERE id = @id
    `);
    this._setLastTest = db.prepare('UPDATE llm_triggers SET last_test = ?, updated_at = ? WHERE id = ?');
    this._setSample = db.prepare('UPDATE llm_triggers SET sample = ?, last_drift = NULL, updated_at = ? WHERE id = ?');
    this._setDrift = db.prepare('UPDATE llm_triggers SET last_drift = ?, updated_at = ? WHERE id = ?');
    this._setMemory = db.prepare('UPDATE llm_triggers SET memory = ?, memory_at = ?, updated_at = ? WHERE id = ?');
    this._recordFire = db.prepare(`
      UPDATE llm_triggers
      SET fire_count = fire_count + 1, last_fired_at = @at, last_status = @status, updated_at = @at,
          consecutive_failures = @streak,
          enabled = CASE WHEN @auto_paused THEN 0 ELSE enabled END,
          paused_reason = CASE WHEN @auto_paused THEN @paused_reason
                               WHEN @succeeded THEN NULL
                               ELSE paused_reason END
      WHERE id = @id
    `);
  }

  insert(row) { this._insert.run(row); }
  get(id) { return this._get.get(id) || null; }
  getByToken(token) { return this._getByToken.get(token) || null; }
  list() { return this._list.all(); }
  listWithRunCounts() { return this._listWithRunCounts.all(); }
  listByConversation(conversationId) { return this._listByConversation.all(conversationId); }
  delete(id) { return this._delete.run(id).changes > 0; }

  updateConfig(params) { this._updateConfig.run(params); }
  restoreTest(params) { this._restoreTest.run(params); }
  setLastTest(id, lastTestJson, at) { this._setLastTest.run(lastTestJson, at, id); }
  setSample(id, sampleJson, at) { this._setSample.run(sampleJson, at, id); }
  setDrift(id, driftJson, at) { this._setDrift.run(driftJson, at, id); }
  setMemory(id, notes, memoryAt, at) { this._setMemory.run(notes, memoryAt, at, id); }
  recordFire(params) { this._recordFire.run(params); }
}

module.exports = TriggerRepository;
