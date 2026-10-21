const { spawn } = require('child_process');
const NvidiaSmi = require('./NvidiaSmi');
const NvidiaSmiOutputParser = require('./NvidiaSmiOutputParser');
const NvidiaSmiOutcome = require('./nvidia-smi/NvidiaSmiOutcome');
const NvidiaSmiBlockReader = require('./nvidia-smi/NvidiaSmiBlockReader');
const RestartBackoff = require('./nvidia-smi/RestartBackoff');
const ComputeAppsGate = require('./nvidia-smi/ComputeAppsGate');

class NvidiaSmiStream {
  static DEFAULT_INTERVAL_MS = 1000;
  static BLOCK_SETTLE_MS = 250;
  static STALE_INTERVALS = 3;
  static MIN_STALE_MS = 5000;
  static MISSING_RETRY_MS = 5 * 60 * 1000;
  static DEFAULT_MAX_AGE_MS = 2000;
  static DEFAULT_READY_MS = 3000;

  constructor(options = {}) {
    this._readSeams(options);
    this._intervalMs = Number(options.intervalMs) > 0 ? Number(options.intervalMs) : NvidiaSmiStream.DEFAULT_INTERVAL_MS;
    this._backoff = new RestartBackoff(options.backoff);
    this._appsGate = new ComputeAppsGate();
    this._cards = new Map();
    this._at = null;
    this._source = null;
    this._outcome = NvidiaSmiOutcome.none();
    this._apps = null;
    this._appsAt = null;
    this._child = null;
    this._generation = 0;
    this._reader = null;
    this._stderrTail = '';
    this._wanted = false;
    this._timers = { stale: null, settle: null, restart: null };
    this._inflight = null;
    this._appsInflight = null;
    this._unsubscribePath = null;
    this._waiters = new Set();
    this._spawns = 0;
    this._blocks = 0;
  }

  static shared = new NvidiaSmiStream();

  static supported(platform = process.platform) {
    return platform !== 'darwin';
  }

  start() {
    if (this._wanted || !NvidiaSmiStream.supported(this._platform)) return false;
    this._wanted = true;
    this._unsubscribePath = this._onPathChange(() => this._onPathChanged());
    this._spawnChild();
    return true;
  }

  stop() {
    this._wanted = false;
    if (this._unsubscribePath) { this._unsubscribePath(); this._unsubscribePath = null; }
    this._clearTimer('restart');
    if (this._child) this._dropChild();
    this._settleReady();
  }

  whenReady(timeoutMs = NvidiaSmiStream.DEFAULT_READY_MS) {
    if (this._isReady() || !this._wanted) return Promise.resolve(this.snapshot());
    return new Promise((resolve) => {
      const waiter = { resolve, timer: null };
      waiter.timer = this._setTimer(() => this._settleWaiter(waiter), timeoutMs);
      this._waiters.add(waiter);
      this.refresh().catch(() => {});
    });
  }

  isRunning() {
    return this._wanted;
  }

  isStreaming() {
    return this._child !== null;
  }

  snapshot() {
    const ok = NvidiaSmiOutcome.isOk(this._outcome);
    const ageMs = this._at == null ? null : Math.max(0, this._now() - this._at);
    return {
      rows: this._rows(),
      at: this._at,
      ageMs,
      source: this._source,
      outcome: this._outcome,
      available: this._outcome.kind !== NvidiaSmiOutcome.MISSING,
      degraded: NvidiaSmiOutcome.isDegraded(this._outcome),
      stale: !ok || ageMs == null || ageMs > this._staleAfterMs(),
    };
  }

  async refresh({ maxAgeMs = NvidiaSmiStream.DEFAULT_MAX_AGE_MS } = {}) {
    if (this._isFresh(maxAgeMs)) return this.snapshot();
    if (!this._inflight) this._inflight = this._queryOnce().finally(() => { this._inflight = null; });
    await this._inflight;
    return this.snapshot();
  }

  async computeApps({ force = false } = {}) {
    const rows = this._rows();
    if (!force && this._apps && !this._appsGate.changed(rows)) return this._apps;
    if (!this.snapshot().available) return this._apps || {};
    if (!this._appsInflight) this._appsInflight = this._queryApps(rows).finally(() => { this._appsInflight = null; });
    await this._appsInflight;
    return this._apps || {};
  }

  cachedComputeApps() {
    if (!this._apps || this._appsGate.changed(this._rows())) this.computeApps().catch(() => {});
    return this._apps || {};
  }

  getState() {
    const snap = this.snapshot();
    return {
      running: this._wanted,
      streaming: this.isStreaming(),
      intervalMs: this._intervalMs,
      outcome: snap.outcome,
      available: snap.available,
      degraded: snap.degraded,
      stale: snap.stale,
      at: snap.at,
      source: snap.source,
      cards: snap.rows.length,
      spawns: this._spawns,
      blocks: this._blocks,
      nextRestartMs: this._backoff.peek(),
      appsAt: this._appsAt,
    };
  }

  _readSeams(o) {
    this._spawn = o.spawn || spawn;
    this._query = o.query || ((args) => NvidiaSmi.query(args));
    this._findOnDisk = o.findOnDisk || (() => NvidiaSmi.findOnDisk());
    this._smiPath = o.smiPath || (() => NvidiaSmi.smiPath());
    this._setSmiPath = o.setSmiPath || ((p) => NvidiaSmi.setSmiPath(p));
    this._onPathChange = o.onPathChange || ((fn) => NvidiaSmi.onPathChange(fn));
    this._now = o.now || (() => Date.now());
    this._log = o.log || console;
    this._platform = o.platform || process.platform;
  }


  _spawnChild() {
    if (!this._wanted || this._child) return;
    const gen = this._generation;
    let child;
    try {
      child = this._spawn(this._smiPath(), NvidiaSmi.streamArgs(this._intervalMs), NvidiaSmi.spawnOptions());
    } catch (err) {
      this._outcome = NvidiaSmiOutcome.fromError(err, this._now());
      this._scheduleRestart();
      return;
    }
    this._child = child;
    this._spawns += 1;
    this._stderrTail = '';
    this._reader = new NvidiaSmiBlockReader({
      onBlock: (rows, info) => this._onBlock(gen, rows, info),
      expectedCount: this._cards.size,
    });
    this._wireChild(child, gen);
    this._armStaleTimer(gen);
  }

  _wireChild(child, gen) {
    child.on('error', (err) => this._onChildError(gen, err));
    child.on('exit', (code, signal) => this._onChildExit(gen, code, signal));
    if (child.stdout) {
      if (typeof child.stdout.setEncoding === 'function') child.stdout.setEncoding('utf8');
      child.stdout.on('data', (chunk) => this._onData(gen, chunk));
    }
    if (child.stderr) {
      if (typeof child.stderr.setEncoding === 'function') child.stderr.setEncoding('utf8');
      child.stderr.on('data', (chunk) => { this._stderrTail = String(chunk).slice(-400); });
    }
    if (typeof child.unref === 'function') child.unref();
  }

  _isCurrent(gen) {
    return gen === this._generation && this._child !== null;
  }

  _onData(gen, chunk) {
    if (!this._isCurrent(gen)) return;
    this._reader.feed(chunk);
    this._armSettleTimer(gen);
    this._armStaleTimer(gen);
  }

  _onBlock(gen, rows, { complete }) {
    if (gen !== this._generation) return;
    this._blocks += 1;
    this._backoff.reset();
    this._applyRows(rows, { complete, source: 'stream' });
  }

  _onChildError(gen, err) {
    if (!this._isCurrent(gen)) return;
    const outcome = NvidiaSmiOutcome.fromError(err, this._now());
    this._dropChild();
    if (outcome.kind === NvidiaSmiOutcome.MISSING) {
      this._handleMissing().catch(() => {});
      return;
    }
    this._outcome = outcome;
    this._scheduleRestart();
  }

  _onChildExit(gen, code, signal) {
    if (!this._isCurrent(gen)) return;
    this._outcome = NvidiaSmiOutcome.fromExit(code, signal, this._now(), this._stderrTail);
    this._dropChild();
    this._scheduleRestart();
  }

  _onStale(gen) {
    if (!this._isCurrent(gen)) return;
    this._outcome = NvidiaSmiOutcome.timeout(this._now());
    this._dropChild();
    this._scheduleRestart();
  }

  _onPathChanged() {
    if (!this._wanted) return;
    this._clearTimer('restart');
    this._backoff.reset();
    if (this._child) this._dropChild();
    this._spawnChild();
  }

  _dropChild() {
    const child = this._child;
    this._child = null;
    this._reader = null;
    this._generation += 1;
    this._clearTimer('stale');
    this._clearTimer('settle');
    if (child && typeof child.kill === 'function') {
      try { child.kill(); } catch (_) {}
    }
  }

  _scheduleRestart(delayMs = this._backoff.next()) {
    if (!this._wanted) return;
    this._clearTimer('restart');
    this._timers.restart = this._setTimer(() => { this._timers.restart = null; this._spawnChild(); }, delayMs);
  }

  async _handleMissing() {
    const moved = await this._relocateBinary();
    if (!this._wanted) return;
    if (moved) {
      if (!this._child) this._spawnChild();
      return;
    }
    this._outcome = NvidiaSmiOutcome.missing(this._now(), this._missingReason());
    this._settleReady();
    this._scheduleRestart(NvidiaSmiStream.MISSING_RETRY_MS);
  }

  async _relocateBinary() {
    const current = this._smiPath();
    let found = null;
    try { found = await this._findOnDisk(); } catch (_) { found = null; }
    if (!found || found === current) return false;
    this._setSmiPath(found);
    return true;
  }

  _missingReason() {
    return `nvidia-smi not found (${this._smiPath()} and the known install locations)`;
  }


  async _queryOnce(relocated = false) {
    const result = await this._query(NvidiaSmi.GPU_ARGS);
    if (result && result.ok) {
      const rows = NvidiaSmiOutputParser.parseGpuRows(result.stdout);
      if (!rows.length) { this._outcome = NvidiaSmiOutcome.parse(this._now()); return; }
      this._applyRows(rows, { complete: true, source: 'oneshot' });
      return;
    }
    const outcome = (result && result.outcome) || NvidiaSmiOutcome.of(NvidiaSmiOutcome.EXIT, 'nvidia-smi query failed', this._now());
    if (outcome.kind !== NvidiaSmiOutcome.MISSING) { this._outcome = outcome; return; }
    if (!relocated && await this._relocateBinary()) return this._queryOnce(true);
    this._outcome = NvidiaSmiOutcome.missing(this._now(), this._missingReason());
    this._settleReady();
  }

  async _queryApps(rows) {
    const result = await this._query(NvidiaSmi.APPS_ARGS);
    this._appsGate.record(rows);
    if (!result || !result.ok) return;
    this._apps = NvidiaSmiOutputParser.parseComputeApps(result.stdout);
    this._appsAt = this._now();
  }


  _applyRows(rows, { complete, source }) {
    const at = this._now();
    if (complete || this._topologyChanged(rows)) this._cards = new Map();
    for (const row of rows) this._cards.set(row.index, { ...row, at });
    this._at = at;
    this._source = source;
    this._outcome = NvidiaSmiOutcome.ok(at);
    this._settleReady();
  }

  _isReady() {
    return this._at != null || this._outcome.kind === NvidiaSmiOutcome.MISSING;
  }

  _settleReady() {
    for (const waiter of [...this._waiters]) this._settleWaiter(waiter);
  }

  _settleWaiter(waiter) {
    if (!this._waiters.delete(waiter)) return;
    clearTimeout(waiter.timer);
    waiter.resolve(this.snapshot());
  }

  _topologyChanged(rows) {
    return rows.some((row) => {
      const known = this._cards.get(row.index);
      return known && known.busId && row.busId && known.busId !== row.busId;
    });
  }

  _rows() {
    return [...this._cards.values()].sort((a, b) => a.index - b.index);
  }

  _isFresh(maxAgeMs) {
    if (!NvidiaSmiOutcome.isOk(this._outcome) || this._at == null) return false;
    return this._now() - this._at <= maxAgeMs;
  }

  _staleAfterMs() {
    return Math.max(NvidiaSmiStream.MIN_STALE_MS, NvidiaSmiStream.STALE_INTERVALS * this._intervalMs);
  }


  _armStaleTimer(gen) {
    this._clearTimer('stale');
    this._timers.stale = this._setTimer(() => { this._timers.stale = null; this._onStale(gen); }, this._staleAfterMs());
  }

  _armSettleTimer(gen) {
    this._clearTimer('settle');
    this._timers.settle = this._setTimer(() => {
      this._timers.settle = null;
      if (this._isCurrent(gen) && this._reader) this._reader.flush();
    }, NvidiaSmiStream.BLOCK_SETTLE_MS);
  }

  _setTimer(fn, ms) {
    const timer = setTimeout(fn, ms);
    if (timer && typeof timer.unref === 'function') timer.unref();
    return timer;
  }

  _clearTimer(name) {
    if (this._timers[name]) { clearTimeout(this._timers[name]); this._timers[name] = null; }
  }
}

module.exports = NvidiaSmiStream;
