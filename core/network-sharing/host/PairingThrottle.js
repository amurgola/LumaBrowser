class PairingThrottle {
  static IP_FREE_FAILS = 5;
  static IP_LOCK_BASE_MS = 30 * 1000;
  static IP_LOCK_CAP_MS = 60 * 60 * 1000;
  static IP_IDLE_MS = 24 * 60 * 60 * 1000;
  static MAX_IP_GUARDS = 1000;
  static GLOBAL_WINDOW_MS = 10 * 60 * 1000;
  static GLOBAL_MISS_BUDGET = 20;
  static GLOBAL_LOCK_BASE_MS = 60 * 1000;
  static GLOBAL_LOCK_CAP_MS = 60 * 60 * 1000;
  static GLOBAL_QUIET_MS = 24 * 60 * 60 * 1000;

  constructor({ now = () => Date.now() } = {}) {
    this._now = now;
    this.reset();
  }

  lockedFor(ip) {
    const now = this._now();
    const guard = this._ipGuards.get(ip);
    const ipLock = guard ? guard.lockedUntil - now : 0;
    return Math.max(0, ipLock, this._global.lockedUntil - now);
  }

  recordFailure(ip) {
    this._recordIpFailure(ip);
    this._evictStaleGuards();
    this._recordGlobalMiss();
  }

  recordSuccess(ip) {
    this._ipGuards.delete(ip);
  }

  reset() {
    this._ipGuards = new Map();
    this._global = { misses: [], trips: 0, lockedUntil: 0, lastMissAt: 0 };
  }

  _recordIpFailure(ip) {
    const now = this._now();
    const guard = this._ipGuards.get(ip) || { fails: 0, lockedUntil: 0, lastFailAt: 0 };
    guard.fails += 1;
    guard.lastFailAt = now;
    if (guard.fails >= PairingThrottle.IP_FREE_FAILS) {
      const doublings = guard.fails - PairingThrottle.IP_FREE_FAILS;
      guard.lockedUntil = now + PairingThrottle._growingLock(PairingThrottle.IP_LOCK_BASE_MS, doublings, PairingThrottle.IP_LOCK_CAP_MS);
    }
    this._ipGuards.delete(ip);
    this._ipGuards.set(ip, guard);
  }

  _evictStaleGuards() {
    const now = this._now();
    for (const [ip, guard] of this._ipGuards) {
      if (guard.lockedUntil <= now && now - guard.lastFailAt >= PairingThrottle.IP_IDLE_MS) this._ipGuards.delete(ip);
    }
    while (this._ipGuards.size > PairingThrottle.MAX_IP_GUARDS) this._ipGuards.delete(this._ipGuards.keys().next().value);
  }

  _recordGlobalMiss() {
    const now = this._now();
    const global = this._global;
    if (now - global.lastMissAt >= PairingThrottle.GLOBAL_QUIET_MS) global.trips = 0;
    global.lastMissAt = now;
    global.misses = global.misses.filter((at) => now - at < PairingThrottle.GLOBAL_WINDOW_MS);
    global.misses.push(now);
    if (global.misses.length < PairingThrottle.GLOBAL_MISS_BUDGET) return;
    global.lockedUntil = now + PairingThrottle._growingLock(PairingThrottle.GLOBAL_LOCK_BASE_MS, global.trips, PairingThrottle.GLOBAL_LOCK_CAP_MS);
    global.trips += 1;
    global.misses = [];
  }

  static _growingLock(baseMs, doublings, capMs) {
    return Math.min(capMs, baseMs * 2 ** Math.min(doublings, 30));
  }
}

module.exports = PairingThrottle;
