class LocalRequestTracker {
  constructor() {
    this._inFlight = 0;
    this._preparing = 0;
    this._listeners = new Set();
  }

  beginPrepare() {
    this._preparing += 1;
  }

  endPrepare() {
    this._preparing = Math.max(0, this._preparing - 1);
  }

  start() {
    this._inFlight += 1;
    this._notify();
  }

  end() {
    this._inFlight = Math.max(0, this._inFlight - 1);
    this._notify();
  }

  inFlight() {
    return this._inFlight;
  }

  isBusy() {
    return this._inFlight > 0 || this._preparing > 0;
  }

  onChange(fn) {
    if (typeof fn !== 'function') return () => {};
    this._listeners.add(fn);
    return () => { this._listeners.delete(fn); };
  }

  _notify() {
    for (const fn of this._listeners) {
      try { fn(this._inFlight); } catch (_) {}
    }
  }
}

module.exports = LocalRequestTracker;
