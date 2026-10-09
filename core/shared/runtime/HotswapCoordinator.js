const VramReleaseWaiter = require('./placement/VramReleaseWaiter');

class HotswapCoordinator {
  static DEFAULT_VRAM_WAIT_MS = 12000;

  constructor({ sleep } = {}) {
    this._servers = new Map();
    this._pools = new Map();
    this._vramWaitMs = HotswapCoordinator.DEFAULT_VRAM_WAIT_MS;
    this._sleep = sleep;
    this._waiter = new VramReleaseWaiter({ sleep });
  }

  configure(pools = [], opts = {}) {
    const previous = this._residentsById();
    this._pools.clear();
    for (const pool of (Array.isArray(pools) ? pools : [])) this._addPool(pool, previous);
    this._applyOptions(opts);
  }

  isEnabled() {
    return this._pools.size > 0;
  }

  sharePool(a, b) {
    const pool = this._poolForServer(a);
    return !!(pool && pool.members.has(b));
  }

  register(serverId, { stop, getState } = {}) {
    if (!serverId || typeof stop !== 'function') return;
    this._servers.set(serverId, { stop, getState: typeof getState === 'function' ? getState : () => 'idle' });
  }

  acquire(serverId) {
    const pool = this._poolForServer(serverId);
    if (!pool) return Promise.resolve(null);
    const run = pool.chain.then(() => this._swapIn(pool, serverId));
    pool.chain = run.catch(() => {});
    return run;
  }

  release(serverId) {
    const pool = this._poolForServer(serverId);
    if (pool && pool.resident === serverId) pool.resident = null;
  }

  snapshot() {
    const pools = [];
    for (const [id, p] of this._pools) pools.push({ id, card: p.card, members: Array.from(p.members), resident: p.resident });
    return { enabled: this.isEnabled(), pools, servers: Array.from(this._servers.keys()) };
  }

  async _swapIn(pool, serverId) {
    const before = this._vramWaitMs > 0 ? this._waiter.read(pool.card) : null;
    const evicted = await this._evictOthers(pool, serverId);
    if (evicted) await this._waiter.wait(pool.card, before ? before.free : null, this._vramWaitMs);
    pool.resident = serverId;
    return pool.card;
  }

  async _evictOthers(pool, serverId) {
    let evicted = false;
    for (const id of pool.members) {
      const server = id === serverId ? null : this._servers.get(id);
      if (!server || !HotswapCoordinator._isLive(server)) continue;
      try { await server.stop(); evicted = true; } catch (_) {}
    }
    return evicted;
  }

  static _isLive(server) {
    try {
      const state = server.getState();
      return !!state && state !== 'idle' && state !== 'stopped';
    } catch (_) {
      return true;
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
