const JsonColumn = require('../../../database/JsonColumn');
const TriggerLifecycle = require('./TriggerLifecycle');

class TriggerRowMapper {
  static trigger(r) {
    const t = {
      id: r.id,
      conversationId: r.conversation_id,
      title: r.title,
      kind: r.kind,
      hookToken: r.hook_token || null,
      source: JsonColumn.parse(r.source, {}),
      action: JsonColumn.parse(r.action, {}),
      sample: TriggerRowMapper._jsonOrNull(r.sample),
      lastTest: TriggerRowMapper._jsonOrNull(r.last_test),
      enabled: !!r.enabled,
      fireCount: r.fire_count || 0,
      lastFiredAt: r.last_fired_at,
      lastStatus: r.last_status,
      consecutiveFailures: r.consecutive_failures || 0,
      pausedReason: r.paused_reason || null,
      lastDrift: TriggerRowMapper._jsonOrNull(r.last_drift),
      memory: r.memory || null,
      memoryAt: r.memory_at || null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
    t.status = TriggerLifecycle.statusOf(t);
    t.armable = TriggerLifecycle.isArmable(t);
    return t;
  }

  static run(r) {
    return {
      id: r.id,
      triggerId: r.trigger_id,
      conversationId: r.conversation_id,
      kind: r.kind || 'event',
      status: r.status,
      startedAt: r.started_at,
      completedAt: r.completed_at,
      error: r.error,
      response: r.response,
      event: TriggerRowMapper._jsonOrNull(r.event),
      dedupeKey: r.dedupe_key || null,
      attempt: r.attempt || 1,
      retryOf: r.retry_of || null,
    };
  }

  static delivery(r) {
    return {
      id: r.id,
      triggerId: r.trigger_id,
      at: r.at,
      source: r.source,
      outcome: r.outcome,
      detail: r.detail,
      runId: r.run_id,
      dedupeKey: r.dedupe_key,
      remote: r.remote,
      event: TriggerRowMapper._jsonOrNull(r.event),
    };
  }

  static version(r) {
    return {
      n: r.n,
      triggerId: r.trigger_id,
      at: r.at,
      origin: r.origin,
      action: JsonColumn.parse(r.action, {}),
      configHash: r.config_hash,
      tested: !!r.tested,
      testAt: r.test_at || null,
      wasArmed: !!r.was_armed,
      note: r.note || null,
      current: false,
    };
  }

  static _jsonOrNull(text) {
    return text ? JsonColumn.parse(text, null) : null;
  }
}

module.exports = TriggerRowMapper;
