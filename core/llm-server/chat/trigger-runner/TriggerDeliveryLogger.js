class TriggerDeliveryLogger {
  constructor({ triggerStore, emitEvent = () => {} }) {
    this._store = triggerStore;
    this._emitEvent = emitEvent;
  }

  log(triggerId, event, { id = null, outcome, detail = null, runId = null, dedupeKey = null, source = 'webhook', remote = null } = {}) {
    try {
      if (id) {
        this._store.updateDelivery(id, { outcome, detail, runId });
        return id;
      }
      const row = this._store.recordDelivery(triggerId, { source, outcome, detail, runId, dedupeKey, remote, event });
      this._emitEvent('delivery', { triggerId, deliveryId: row.id, outcome, detail });
      return row.id;
    } catch (_) {
      return id;
    }
  }
}

module.exports = TriggerDeliveryLogger;
