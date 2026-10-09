class LendWaiters {
  constructor() {
    this._entries = [];
  }

  wait(timeoutMs) {
    return new Promise((resolve) => {
      const entry = { resolve, timer: null };
      entry.timer = setTimeout(() => {
        this._entries = this._entries.filter((e) => e !== entry);
        resolve(false);
      }, timeoutMs);
      if (entry.timer.unref) entry.timer.unref();
      this._entries.push(entry);
    });
  }

  wakeAll() {
    for (const entry of this._entries.splice(0)) {
      clearTimeout(entry.timer);
      try { entry.resolve(true); } catch (_) {}
    }
  }

  get size() {
    return this._entries.length;
  }
}

module.exports = LendWaiters;
