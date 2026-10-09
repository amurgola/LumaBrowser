class TriggerRunQueue {
  static DEPTH = 20;

  constructor({ logger, emitEvent = () => {} }) {
    this._logger = logger;
    this._emitEvent = emitEvent;
    this._items = [];
  }

  get length() {
    return this._items.length;
  }

  depth(triggerId) {
    return this._items.filter((item) => item.triggerId === triggerId).length;
  }

  makeRoom(trigger) {
    const mine = this._items.filter((item) => item.triggerId === trigger.id);
    if (mine.length < TriggerRunQueue.DEPTH) return;
    const oldest = mine[0];
    this._items.splice(this._items.indexOf(oldest), 1);
    for (const id of [oldest.deliveryId, ...(oldest.deliveryIds || [])].filter(Boolean)) {
      this._logger.log(trigger.id, null, { id, outcome: 'queue_dropped', detail: `queue full (${TriggerRunQueue.DEPTH})` });
    }
    oldest.resolve(null);
    this._emitEvent('queue-dropped', { triggerId: trigger.id, title: trigger.title || null });
  }

  push(item) {
    this._items.push(item);
  }

  shift() {
    return this._items.shift();
  }

  takeAll() {
    return this._items.splice(0);
  }
}

module.exports = TriggerRunQueue;
