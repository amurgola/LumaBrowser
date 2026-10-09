const PendingTriggerWork = require('./PendingTriggerWork');
const TriggerGating = require('../triggers/TriggerGating');

class TriggerBatchWindows extends PendingTriggerWork {
  depth(triggerId) {
    const batch = this._entries.get(triggerId);
    return batch ? batch.events.length : 0;
  }

  add(trigger, event, { deliveryId, dedupeKey }) {
    const cfg = trigger.source.batch;
    const batch = this._entries.get(trigger.id) || this._open(trigger, cfg);
    const waiter = PendingTriggerWork._deferred();
    batch.events.push(event);
    batch.deliveryIds.push(deliveryId);
    if (dedupeKey) batch.dedupeKeys.push(dedupeKey);
    batch.resolvers.push(waiter.resolve);
    this._logger.log(trigger.id, null, { id: deliveryId, outcome: 'batched', detail: `batch ${batch.events.length}/${cfg.max}, window ${Math.round(cfg.windowMs / 1000)} s` });
    this._emitEvent('batched', { triggerId: trigger.id, count: batch.events.length, max: cfg.max, title: trigger.title || null });
    if (batch.events.length >= cfg.max) this._flush(trigger.id, 'max');
    return waiter.promise;
  }

  _open(trigger, cfg) {
    const batch = { events: [], deliveryIds: [], dedupeKeys: [], resolvers: [], timer: null, startedAt: Date.now() };
    this._entries.set(trigger.id, batch);
    this._startTimer(batch, cfg.windowMs, () => this._flush(trigger.id, 'window'));
    return batch;
  }

  _flush(triggerId, reason) {
    const batch = this._take(triggerId);
    if (!batch) return;
    const trigger = this._store.get(triggerId);
    if (!trigger || this._isStopped()) {
      for (const resolve of batch.resolvers) resolve(null);
      return;
    }
    const cfg = trigger.source.batch || {};
    const event = TriggerGating.buildBatchEvent(batch.events, { windowMs: cfg.windowMs, reason });
    const fire = this._enqueue(trigger, event, {
      kind: 'event', dedupeKey: null, deliveryIds: batch.deliveryIds, detail: `batch of ${batch.events.length} (${reason})`,
    });
    fire.done.then(
      (run) => { for (const resolve of batch.resolvers) resolve(run); },
      () => { for (const resolve of batch.resolvers) resolve(null); },
    );
  }

  _drop(triggerId, batch) {
    for (const id of batch.deliveryIds) {
      this._logger.log(triggerId, null, { id, outcome: 'dropped', detail: 'app shutting down (batch not run)' });
    }
    for (const resolve of batch.resolvers) resolve(null);
  }
}

module.exports = TriggerBatchWindows;
