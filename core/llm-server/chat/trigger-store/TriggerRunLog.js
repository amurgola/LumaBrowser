const RecordId = require('../../../database/RecordId');
const CappedJson = require('./CappedJson');
const TriggerRowMapper = require('./TriggerRowMapper');

class TriggerRunLog {
  static ID_PREFIX = 'trun';
  static MAX_RESPONSE_CHARS = 20000;
  static MAX_EVENT_CHARS = 64 * 1024;
  static MAX_LIST_LIMIT = 200;

  constructor(repository) {
    this._runs = repository;
  }

  static newId() {
    return RecordId.create(TriggerRunLog.ID_PREFIX);
  }

  start(triggerId, { conversationId, kind, event, dedupeKey, attempt, retryOf } = {}) {
    const row = {
      id: TriggerRunLog.newId(),
      trigger_id: triggerId,
      conversation_id: conversationId || null,
      kind: kind || 'event',
      status: 'running',
      started_at: new Date().toISOString(),
      event: event == null ? null : CappedJson.stringify(event, TriggerRunLog.MAX_EVENT_CHARS),
      dedupe_key: dedupeKey ? String(dedupeKey) : null,
      attempt: Number.isFinite(attempt) && attempt > 1 ? attempt : 1,
      retry_of: retryOf || null,
    };
    this._runs.insert(row);
    return this.get(row.id);
  }

  finish(runId, { status, error, response } = {}) {
    const capped = response ? String(response).slice(0, TriggerRunLog.MAX_RESPONSE_CHARS) : null;
    this._runs.finish(runId, status || 'ok', new Date().toISOString(), error || null, capped);
    return this.get(runId);
  }

  get(id) {
    const row = this._runs.get(id);
    return row ? TriggerRowMapper.run(row) : null;
  }

  list(triggerId, { limit = 50, offset = 0 } = {}) {
    return this._runs.list(triggerId, Math.min(limit, TriggerRunLog.MAX_LIST_LIMIT), offset).map(TriggerRowMapper.run);
  }

  hasDedupeKey(triggerId, key) {
    return key ? this._runs.hasDedupeKey(triggerId, String(key)) : false;
  }

  conversationIds(triggerId) {
    return this._runs.conversationIds(triggerId).filter(Boolean);
  }

  pruneTranscripts(triggerId, keep) {
    const stale = this._runs.withConversationBeyond(triggerId, Math.max(0, keep));
    for (const run of stale) this._runs.clearConversation(run.id);
    return stale.map((run) => run.conversation_id).filter(Boolean);
  }

  latestRealEvent(triggerId) {
    const run = this.list(triggerId, { limit: 20 })
      .find((r) => r.kind === 'event' && r.event != null && r.event.event !== 'batch');
    if (!run) return null;
    const event = { ...run.event };
    delete event.catchUp;
    return { runId: run.id, event };
  }

  deleteForTrigger(triggerId) {
    this._runs.deleteForTrigger(triggerId);
  }
}

module.exports = TriggerRunLog;
