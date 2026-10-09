class FrameWaiters {
  static DEFAULT_TIMEOUT_MS = 15000;

  constructor() {
    this._waiters = new Map();
  }

  get size() { return this._waiters.size; }

  wait(type, timeoutMs = FrameWaiters.DEFAULT_TIMEOUT_MS) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this._waiters.delete(type);
        resolve({ __error: { message: `no ${type} from LumaBrowser` } });
      }, timeoutMs);
      this._waiters.set(type, (payload) => { clearTimeout(timer); resolve(payload); });
    });
  }

  deliver(type, payload) {
    const waiter = this._waiters.get(type);
    if (waiter) { this._waiters.delete(type); waiter(payload); }
    if (type !== 'bridge-error' || !this._waiters.size) return false;
    for (const [, resolve] of this._waiters) resolve({ __error: payload || {} });
    this._waiters.clear();
    return true;
  }
}

module.exports = FrameWaiters;
