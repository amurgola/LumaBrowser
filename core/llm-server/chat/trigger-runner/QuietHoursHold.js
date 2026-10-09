const PendingTriggerWork = require('./PendingTriggerWork');
const QuietHours = require('../triggers/QuietHours');

class QuietHoursHold extends PendingTriggerWork {
  static MIN_RELEASE_DELAY_MS = 1000;

  status(triggerId) {
    const hold = this._entries.get(triggerId);
    return hold && hold.items.length ? { count: hold.items.length, resumesAt: hold.resumesAt.toISOString() } : null;
  }

  add(trigger, event, { dedupeKey, source, remote, resumesAt, deliveryId }) {
    const waiter = PendingTriggerWork._deferred();
    const hold = this._holdUntil(trigger.id, resumesAt);
    if (hold.items.length >= QuietHours.MAX_DEFERRED) this._dropOldest(trigger.id, hold);
    hold.items.push({ event, dedupeKey, source, remote, deliveryId, resolve: waiter.resolve });
    this._emitEvent('deferred', { triggerId: trigger.id, title: trigger.title || null, count: hold.items.length, resumesAt: resumesAt.toISOString() });
    return waiter.promise;
  }

  _holdUntil(triggerId, resumesAt) {
    const current = this._entries.get(triggerId);
    if (current && current.resumesAt.getTime() === resumesAt.getTime()) return current;
    if (current && current.timer) clearTimeout(current.timer);
    const hold = { items: (current && current.items) || [], timer: null, resumesAt };
    const delay = Math.max(QuietHoursHold.MIN_RELEASE_DELAY_MS, resumesAt.getTime() - Date.now());
    this._startTimer(hold, delay, () => this._release(triggerId));
    this._entries.set(triggerId, hold);
    return hold;
  }

  _dropOldest(triggerId, hold) {
    const oldest = hold.items.shift();
    this._logger.log(triggerId, null, { id: oldest.deliveryId, outcome: 'dropped', detail: `quiet-hours hold full (${QuietHours.MAX_DEFERRED})` });
    oldest.resolve(null);
  }

  _release(triggerId) {
    const hold = this._take(triggerId);
    if (!hold) return;
    const trigger = this._store.get(triggerId);
    for (const item of hold.items) {
      if (!trigger || !trigger.enabled || this._isStopped()) {
        this._logger.log(triggerId, null, { id: item.deliveryId, outcome: 'dropped', detail: trigger ? 'trigger paused during quiet hours' : 'trigger deleted during quiet hours' });
        item.resolve(null);
        continue;
      }
      const fire = this._enqueue(trigger, item.event, { kind: 'event', dedupeKey: item.dedupeKey, source: item.source, remote: item.remote, deliveryId: item.deliveryId });
      fire.done.then((run) => item.resolve(run), () => item.resolve(null));
    }
    this._emitEvent('released', { triggerId, title: trigger ? trigger.title : null, count: hold.items.length });
  }

  _drop(triggerId, hold) {
    for (const item of hold.items) {
      this._logger.log(triggerId, null, { id: item.deliveryId, outcome: 'dropped', detail: 'app shutting down (held for quiet hours)' });
      item.resolve(null);
    }
  }
}

module.exports = QuietHoursHold;
