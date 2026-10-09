class AiCallLimiter {
  static MAX_INFLIGHT = 2;
  static MAX_QUEUED = 6;

  constructor({ maxInFlight = AiCallLimiter.MAX_INFLIGHT, maxQueued = AiCallLimiter.MAX_QUEUED } = {}) {
    this._maxInFlight = maxInFlight;
    this._maxQueued = maxQueued;
    this.load = new Map();
  }

  acquire(conversationId) {
    const entry = this._entry(conversationId);
    if (entry.inFlight < this._maxInFlight) {
      entry.inFlight += 1;
      return Promise.resolve(true);
    }
    if (entry.queued >= this._maxQueued) return Promise.resolve(false);
    entry.queued += 1;
    return new Promise((resolve) => { entry.waiters.push(resolve); });
  }

  release(conversationId) {
    const entry = this.load.get(conversationId);
    if (!entry) return;
    const next = entry.waiters.shift();
    if (next) {
      entry.queued -= 1;
      next(true);
      return;
    }
    entry.inFlight = Math.max(0, entry.inFlight - 1);
    if (!entry.inFlight && !entry.queued) this.load.delete(conversationId);
  }

  _entry(conversationId) {
    let entry = this.load.get(conversationId);
    if (!entry) {
      entry = { inFlight: 0, queued: 0, waiters: [] };
      this.load.set(conversationId, entry);
    }
    return entry;
  }
}

module.exports = AiCallLimiter;
