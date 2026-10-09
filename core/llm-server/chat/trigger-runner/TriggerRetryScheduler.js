const PendingTriggerWork = require('./PendingTriggerWork');
const TriggerFailurePolicy = require('../trigger-store/TriggerFailurePolicy');

class TriggerRetryScheduler extends PendingTriggerWork {
  static MIN_DELAY_MS = 1000;
  static JITTER = 0.2;
  static ERROR_PREVIEW_CHARS = 160;

  static backoffMs(base, attempt) {
    const raw = base * Math.pow(2, Math.max(0, attempt - 1));
    const jitter = raw * TriggerRetryScheduler.JITTER * (Math.random() * 2 - 1);
    return Math.max(TriggerRetryScheduler.MIN_DELAY_MS, Math.round(raw + jitter));
  }

  static retryable(errorText, shapeError = null) {
    if (shapeError) return false;
    return !!errorText;
  }

  pending(triggerId) {
    const retry = this._entries.get(triggerId);
    return retry ? { at: new Date(retry.at).toISOString(), attempt: retry.attempt, of: retry.runId } : null;
  }

  schedule(trigger, event, { attempt, runId, dedupeKey, source, resolvers, errorText }) {
    const policy = TriggerFailurePolicy.of(trigger);
    if (attempt > policy.retryMax || this.has(trigger.id)) return null;
    const delay = TriggerRetryScheduler.backoffMs(policy.retryBackoffMs, attempt);
    const deliveryId = this._logger.log(trigger.id, event, {
      outcome: 'retry_scheduled', source, runId,
      detail: `retry ${attempt}/${policy.retryMax} in ${Math.round(delay / 1000)} s after: ${String(errorText || 'error').slice(0, TriggerRetryScheduler.ERROR_PREVIEW_CHARS)}`,
    });
    const retry = { at: Date.now() + delay, attempt, runId, deliveryId, resolvers: resolvers || [], timer: null };
    this._startTimer(retry, delay, () => this._fire(trigger.id, event, retry, { dedupeKey, source }));
    this._entries.set(trigger.id, retry);
    this._emitEvent('retry-scheduled', { triggerId: trigger.id, title: trigger.title || null, attempt, inMs: delay });
    return delay;
  }

  _fire(triggerId, event, retry, { dedupeKey, source }) {
    this._entries.delete(triggerId);
    const fresh = this._store.get(triggerId);
    if (!fresh || !fresh.enabled || this._isStopped()) {
      this._logger.log(triggerId, null, { id: retry.deliveryId, outcome: 'dropped', detail: fresh ? 'trigger paused before the retry' : 'trigger deleted before the retry' });
      for (const resolve of retry.resolvers) resolve(null);
      return;
    }
    const fire = this._enqueue(fresh, event, {
      kind: 'event', dedupeKey, source, deliveryId: retry.deliveryId,
      attempt: retry.attempt + 1, retryOf: retry.runId, resolvers: retry.resolvers,
    });
    fire.done.catch(() => {});
  }

  _drop(triggerId, retry) {
    this._logger.log(triggerId, null, { id: retry.deliveryId, outcome: 'dropped', detail: 'app shutting down (retry not run)' });
    for (const resolve of retry.resolvers) resolve(null);
  }
}

module.exports = TriggerRetryScheduler;
