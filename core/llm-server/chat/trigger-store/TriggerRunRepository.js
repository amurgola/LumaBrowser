class TriggerRunRepository {
  constructor(db) {
    this._insert = db.prepare(`
      INSERT INTO llm_trigger_runs (id, trigger_id, conversation_id, kind, status, started_at, event, dedupe_key, attempt, retry_of)
      VALUES (@id, @trigger_id, @conversation_id, @kind, @status, @started_at, @event, @dedupe_key, @attempt, @retry_of)
    `);
    this._finish = db.prepare('UPDATE llm_trigger_runs SET status = ?, completed_at = ?, error = ?, response = ? WHERE id = ?');
    this._get = db.prepare('SELECT * FROM llm_trigger_runs WHERE id = ?');
    this._list = db.prepare('SELECT * FROM llm_trigger_runs WHERE trigger_id = ? ORDER BY started_at DESC, rowid DESC LIMIT ? OFFSET ?');
    this._hasDedupe = db.prepare('SELECT 1 FROM llm_trigger_runs WHERE trigger_id = ? AND dedupe_key = ? LIMIT 1');
    this._conversationIds = db.prepare(
      'SELECT conversation_id FROM llm_trigger_runs WHERE trigger_id = ? AND conversation_id IS NOT NULL',
    );
    this._withConversationBeyond = db.prepare(`
      SELECT id, conversation_id FROM llm_trigger_runs
      WHERE trigger_id = ? AND conversation_id IS NOT NULL
      ORDER BY started_at DESC, rowid DESC
      LIMIT -1 OFFSET ?
    `);
    this._clearConversation = db.prepare('UPDATE llm_trigger_runs SET conversation_id = NULL WHERE id = ?');
    this._deleteForTrigger = db.prepare('DELETE FROM llm_trigger_runs WHERE trigger_id = ?');
  }

  insert(row) { this._insert.run(row); }
  finish(id, status, completedAt, error, response) { this._finish.run(status, completedAt, error, response, id); }
  get(id) { return this._get.get(id) || null; }
  list(triggerId, limit, offset) { return this._list.all(triggerId, limit, offset); }
  hasDedupeKey(triggerId, key) { return !!this._hasDedupe.get(triggerId, key); }
  conversationIds(triggerId) { return this._conversationIds.all(triggerId).map((r) => r.conversation_id); }
  withConversationBeyond(triggerId, keep) { return this._withConversationBeyond.all(triggerId, keep); }
  clearConversation(id) { this._clearConversation.run(id); }
  deleteForTrigger(triggerId) { this._deleteForTrigger.run(triggerId); }
}

module.exports = TriggerRunRepository;
