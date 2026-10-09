const RecordId = require('../../../database/RecordId');
const CappedJson = require('./CappedJson');
const DeliveryEventSummary = require('./DeliveryEventSummary');
const TriggerRowMapper = require('./TriggerRowMapper');

class TriggerDeliveryLog {
  static ID_PREFIX = 'tdel';
  static KEEP = 200;
  static MAX_EVENT_CHARS = 4 * 1024;
  static MAX_DETAIL_CHARS = 500;
  static MAX_REMOTE_CHARS = 80;
  static OUTCOMES = ['captured', 'queued', 'fired', 'duplicate', 'unarmed', 'rate_limited', 'rejected', 'no_secret',
    'handshake', 'queue_dropped', 'dropped', 'error', 'filtered', 'cooldown', 'batched', 'retry_scheduled', 'deferred', 'quiet'];
  static DRIFT_NOTE = /shape drift:.*$/;

  constructor(repository) {
    this._deliveries = repository;
  }

  record(triggerId, { source, outcome, detail, runId, dedupeKey, remote, event } = {}) {
    const row = {
      id: RecordId.create(TriggerDeliveryLog.ID_PREFIX),
      trigger_id: triggerId,
      at: new Date().toISOString(),
      source: source || 'webhook',
      outcome: TriggerDeliveryLog._outcome(outcome),
      detail: detail ? String(detail).slice(0, TriggerDeliveryLog.MAX_DETAIL_CHARS) : null,
      run_id: runId || null,
      dedupe_key: dedupeKey ? String(dedupeKey) : null,
      remote: remote ? String(remote).slice(0, TriggerDeliveryLog.MAX_REMOTE_CHARS) : null,
      event: event == null ? null : CappedJson.stringify(DeliveryEventSummary.compact(event), TriggerDeliveryLog.MAX_EVENT_CHARS),
    };
    this._deliveries.insert(row);
    this._prune(triggerId);
    return this.get(row.id);
  }

  update(id, { outcome, detail, runId } = {}) {
    if (!id) return null;
    this._deliveries.update(id, TriggerDeliveryLog._outcome(outcome), this._detailKeepingDrift(id, detail || null), runId || null);
    return this.get(id);
  }

  get(id) {
    const row = this._deliveries.get(id);
    return row ? TriggerRowMapper.delivery(row) : null;
  }

  list(triggerId, { limit = 50, offset = 0 } = {}) {
    return this._deliveries.list(triggerId, Math.min(limit, TriggerDeliveryLog.KEEP), offset).map(TriggerRowMapper.delivery);
  }

  counts(triggerId) {
    const out = {};
    for (const r of this._deliveries.counts(triggerId)) out[r.outcome] = r.n;
    return out;
  }

  deleteForTrigger(triggerId) {
    this._deliveries.deleteForTrigger(triggerId);
  }

  static _outcome(outcome) {
    return TriggerDeliveryLog.OUTCOMES.includes(outcome) ? outcome : 'error';
  }

  _detailKeepingDrift(id, detail) {
    if (!detail) return null;
    const current = this._deliveries.get(id);
    const drift = current && current.detail ? String(current.detail).match(TriggerDeliveryLog.DRIFT_NOTE) : null;
    return drift && !detail.includes('shape drift:') ? `${detail}; ${drift[0]}` : detail;
  }

  _prune(triggerId) {
    try { this._deliveries.prune(triggerId, TriggerDeliveryLog.KEEP); } catch (_) {}
  }
}

module.exports = TriggerDeliveryLog;
