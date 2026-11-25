const VramReleaseWaiter = require('./placement/VramReleaseWaiter');

class HotswapCoordinator {
  static DEFAULT_VRAM_WAIT_MS = 12000;
  static ROUND_TRIP_POOL_ID = 'auto-swap';
  static SUSPEND_CONFIRM_MS = 2500;
  static EVICTION = Object.freeze({ STOPPED: 'stopped', FREED: 'freed', HELD_NOTHING: 'held-nothing', FAILED: 'failed' });

  constructor({ sleep } = {}) {
    this._servers = new Map();
    this._pools = new Map();
    this._suspended = new Set();
    this._vramWaitMs = HotswapCoordinator.DEFAULT_VRAM_WAIT_MS;
    this._sleep = sleep;
    this._waiter = new VramReleaseWaiter({ sleep });
  }

  configure(pools = [], opts = {}) {
    const previous = this._residentsById();
    const roundTrip = this._pools.get(HotswapCoordinator.ROUND_TRIP_POOL_ID);
    this._pools.clear();
    for (const pool of (Array.isArray(pools) ? pools : [])) this._addPool(pool, previous);
    this._keepRoundTrip(roundTrip);
    this._applyOptions(opts);
    this._stopUnpooledSuspended();
  }

  isEnabled() {
    return this._pools.size > 0;
  }

  sharePool(a, b) {
    const pool = this._poolForServer(a);
    return !!(pool && pool.members.has(b));
  }

  isPooled(serverId) {
    return !!this._poolForServer(serverId);
  }

  isDisplaced(serverId) {
    const pool = this._poolForServer(serverId);
    return !!pool && pool.resident !== serverId;
  }

  register(serverId, { stop, getState, suspend } = {}) {
    if (!serverId || typeof stop !== 'function') return;
    this._servers.set(serverId, {
      stop,
      getState: typeof getState === 'function' ? getState : () => 'idle',
      suspend: typeof suspend === 'function' ? suspend : null,
    });
  }

  acquire(serverId) {
    const pool = this._poolForServer(serverId);
    if (!pool) return Promise.resolve(null);
    const run = pool.chain.then(() => this._swapIn(pool, serverId));
    pool.chain = run.catch(() => {});
    return run;
  }

  reclaim(serverId) {
    const pool = this._poolForServer(serverId);
    if (!pool) return Promise.resolve(null);
    const run = pool.chain.then(() => (this._needsReclaim(pool, serverId) ? this._swapIn(pool, serverId) : null));
    pool.chain = run.catch(() => {});
    return run;
  }

  swapOut(serverId, residentIds, card) {
    const members = [serverId, ...residentIds];
    if (!Number.isInteger(card) || members.some((id) => this._poolForServer(id))) return Promise.resolve(null);
    this._pools.set(HotswapCoordinator.ROUND_TRIP_POOL_ID, {
      card, members: new Set(members), resident: null, chain: Promise.resolve(), borrower: serverId,
    });
    return this.acquire(serverId);
  }

  release(serverId) {
    const pool = this._poolForServer(serverId);
    if (pool && pool.resident === serverId) pool.resident = null;
  }

  snapshot() {
    const pools = [];
    for (const [id, p] of this._pools) pools.push({ id, card: p.card, members: Array.from(p.members), resident: p.resident });
    return { enabled: this.isEnabled(), pools, servers: Array.from(this._servers.keys()), suspended: Array.from(this._suspended) };
  }

  async _swapIn(pool, serverId) {
    const before = this._vramWaitMs > 0 ? this._waiter.read(pool.card) : null;
    const evictions = await this._evictOthers(pool, serverId);
    await this._waitForRelease(pool.card, before, evictions);
    pool.resident = serverId;
    this._endRoundTrip(pool, serverId);
    return pool.card;
  }

  _keepRoundTrip(roundTrip) {
    if (!roundTrip) return;
    for (const member of roundTrip.members) if (this._poolForServer(member)) return;
    this._pools.set(HotswapCoordinator.ROUND_TRIP_POOL_ID, roundTrip);
  }

  _endRoundTrip(pool, serverId) {
    if (this._endsRoundTrip(pool, serverId)) this._pools.delete(HotswapCoordinator.ROUND_TRIP_POOL_ID);
  }

  _endsRoundTrip(pool, serverId) {
    return !!pool.borrower && serverId !== pool.borrower && this._pools.get(HotswapCoordinator.ROUND_TRIP_POOL_ID) === pool;
  }

  _needsReclaim(pool, serverId) {
    const server = this._servers.get(serverId);
    return pool.resident !== serverId && !!server && HotswapCoordinator._isReady(server);
  }

  async _evictOthers(pool, serverId) {
    const maySuspend = !this._endsRoundTrip(pool, serverId);
    const evictions = [];
    for (const id of pool.members) {
      const server = id === serverId ? null : this._servers.get(id);
      if (!server || !HotswapCoordinator._isLive(server)) continue;
      const eviction = await HotswapCoordinator._evict(server, maySuspend);
      this._noteSuspended(id, eviction);
      evictions.push(eviction);
    }
    this._suspended.delete(serverId);
    return evictions;
  }

  _noteSuspended(serverId, eviction) {
    const { FREED, HELD_NOTHING } = HotswapCoordinator.EVICTION;
    if (eviction === FREED || eviction === HELD_NOTHING) this._suspended.add(serverId);
    else this._suspended.delete(serverId);
  }

  _stopUnpooledSuspended() {
    for (const id of Array.from(this._suspended)) {
      if (this._poolForServer(id)) continue;
      this._suspended.delete(id);
      const server = this._servers.get(id);
      if (server && HotswapCoordinator._isLive(server)) Promise.resolve().then(() => server.stop()).catch(() => {});
    }
  }

  static async _evict(server, maySuspend) {
    const suspended = maySuspend ? await HotswapCoordinator._trySuspend(server) : null;
    if (suspended) return suspended;
    try {
      await server.stop();
      return HotswapCoordinator.EVICTION.STOPPED;
    } catch (_) {
      return HotswapCoordinator.EVICTION.FAILED;
    }
  }

  static async _trySuspend(server) {
    if (!server.suspend) return null;
    try {
      const result = await server.suspend();
      if (!result || result.suspended !== true) return null;
      return result.freed === false ? HotswapCoordinator.EVICTION.HELD_NOTHING : HotswapCoordinator.EVICTION.FREED;
    } catch (_) {
      return null;
    }
  }

  async _waitForRelease(card, before, evictions) {
    const waitMs = this._releaseWaitMs(evictions);
    if (waitMs > 0) await this._waiter.wait(card, before ? before.free : null, waitMs);
  }

  _releaseWaitMs(evictions) {
    const { STOPPED, FREED } = HotswapCoordinator.EVICTION;
    if (evictions.includes(STOPPED)) return this._vramWaitMs;
    if (evictions.includes(FREED)) return Math.min(this._vramWaitMs, HotswapCoordinator.SUSPEND_CONFIRM_MS);
    return 0;
  }

  static _isLive(server) {
    try {
      const state = server.getState();
      return !!state && state !== 'idle' && state !== 'stopped';
    } catch (_) {
      return true;
    }
  }

  static _isReady(server) {
    try {
      return server.getState() === 'ready';
    } catch (_) {
      return false;
    }
  }

  _residentsById() {
    const residents = new Map();
    for (const [id, p] of this._pools) residents.set(id, p.resident);
    return residents;
  }

  _addPool(pool, previous) {
    if (!pool || !Array.isArray(pool.members) || pool.members.length < 2) return;
    const card = Number(pool.card);
    if (!Number.isInteger(card)) return;
    const id = String(pool.id || `pool_${card}`);
    this._pools.set(id, {
      card,
      members: new Set(pool.members),
      resident: previous.has(id) ? previous.get(id) : null,
      chain: Promise.resolve(),
    });
  }

  _applyOptions(opts) {
    if (opts.vramWaitMs !== undefined) this._vramWaitMs = Math.max(0, Number(opts.vramWaitMs) || 0);
    if (opts.cardFreeReader !== undefined) {
      const readCardFree = typeof opts.cardFreeReader === 'function' ? opts.cardFreeReader : undefined;
      this._waiter = new VramReleaseWaiter({ readCardFree, sleep: this._sleep });
    }
  }

  _poolForServer(serverId) {
    for (const pool of this._pools.values()) if (pool.members.has(serverId)) return pool;
    return null;
  }

  static shared = new HotswapCoordinator();
}

module.exports = HotswapCoordinator;
