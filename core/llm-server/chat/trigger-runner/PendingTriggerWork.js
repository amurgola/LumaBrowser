class PendingTriggerWork {
  constructor({ triggerStore, logger, emitEvent = () => {}, enqueue, isStopped }) {
    this._store = triggerStore;
    this._logger = logger;
    this._emitEvent = emitEvent;
    this._enqueue = enqueue;
    this._isStopped = isStopped;
    this._entries = new Map();
  }

  has(triggerId) {
    return this._entries.has(triggerId);
  }

  dropAll() {
    for (const [triggerId, entry] of this._entries) {
      if (entry.timer) clearTimeout(entry.timer);
      this._drop(triggerId, entry);
    }
    this._entries.clear();
  }

  _drop(_triggerId, _entry) {
    throw new Error(`${this.constructor.name} must implement _drop()`);
  }

  _startTimer(entry, delayMs, onFire) {
    entry.timer = setTimeout(onFire, delayMs);
    if (entry.timer.unref) entry.timer.unref();
  }

  _take(triggerId) {
    const entry = this._entries.get(triggerId);
    if (!entry) return null;
    this._entries.delete(triggerId);
    if (entry.timer) clearTimeout(entry.timer);
    return entry;
  }

  static _deferred() {
    let resolve;
    const promise = new Promise((r) => { resolve = r; });
    return { promise, resolve };
  }
}

module.exports = PendingTriggerWork;
