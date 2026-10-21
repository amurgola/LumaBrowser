const NvidiaSmiStream = require('../../shared/runtime/NvidiaSmiStream');
const NvidiaSmiOutcome = require('../../shared/runtime/nvidia-smi/NvidiaSmiOutcome');
const VramCoordinator = require('../../shared/runtime/VramCoordinator');
const CudaDevicePicker = require('../../shared/runtime/CudaDevicePicker');
const LedgerCards = require('./vram-watchdog/LedgerCards');
const WatchedCard = require('./vram-watchdog/WatchedCard');

class VramWatchdog {
  static DEFAULT_INTERVAL_MS = 5000;
  static DEFAULT_CONFIRM_SAMPLES = 2;
  static DEFAULT_DWELL_MS = 30 * 1000;
  static DEFAULT_OWN_LOAD_GRACE_MS = 15 * 1000;
  static MISSING_RETRY_MAX_MS = 5 * 60 * 1000;

  constructor(options = {}) {
    this._readHooks(options);
    this._readTimings(options);
    this._cards = new Map();
    this._timer = null;
    this._running = false;
    this._ticking = false;
    this._available = true;
    this._degraded = false;
    this._outcome = NvidiaSmiOutcome.none();
    this._missingRuns = 0;
    this._lastSampleAt = null;
    this._lastGoodAt = null;
    this._unloads = 0;
  }

  start() {
    if (this._running) return false;
    if (!this._isLoaded()) return false;
    this._running = true;
    if (this._ownsStream && this._stream && typeof this._stream.start === 'function') this._stream.start();
    this.tick();
    return true;
  }

  stop() {
    this._running = false;
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    for (const card of this._cards.values()) card.reset();
  }

  isRunning() {
    return this._running;
  }

  async tick() {
    if (this._ticking) return;
    this._ticking = true;
    try {
      const reading = await this._read();
      for (const card of this._observeReading(reading)) await this._maybeUnload(card);
    } catch (err) {
      this._warn('[vram-watchdog] tick failed:', err);
    } finally {
      this._ticking = false;
      if (this._running) this._schedule();
    }
  }

  dismiss(card) {
    const watched = this._cards.get(Number(card));
    if (!watched || !watched.dismiss()) return false;
    this._emit('vram-pressure', { ...watched.view(), prevBand: watched.band });
    return true;
  }

  getState() {
    return {
      available: this._available,
      degraded: this._degraded,
      outcome: { kind: this._outcome.kind, reason: this._outcome.reason },
      running: this._running,
      intervalMs: this._intervalMs,
      lastSampleAt: this._lastSampleAt,
      lastGoodAt: this._lastGoodAt,
      unloads: this._unloads,
      cards: [...this._cards.values()].sort((a, b) => a.index - b.index).map((c) => c.view()),
    };
  }

  async _read() {
    try {
      const result = await this._sample();
      if (Array.isArray(result)) return { rows: result, outcome: NvidiaSmiOutcome.ok(this._now()) };
      if (result && Array.isArray(result.rows)) return { rows: result.rows, outcome: result.outcome || NvidiaSmiOutcome.ok(this._now()) };
      return { rows: [], outcome: NvidiaSmiOutcome.parse(this._now(), 'sampler returned no rows') };
    } catch (err) {
      return { rows: [], outcome: NvidiaSmiOutcome.of(NvidiaSmiOutcome.EXIT, (err && err.message) || 'sampler failed', this._now()) };
    }
  }

  * _observeReading({ rows, outcome }) {
    this._lastSampleAt = this._now();
    this._outcome = outcome;
    if (!NvidiaSmiOutcome.isOk(outcome)) {
      this._noteDegraded(outcome);
      return;
    }
    const usable = (rows || []).filter((r) => r && Number(r.totalBytes) > 0);
    if (!usable.length) {
      this._noteDegraded(NvidiaSmiOutcome.parse(this._now(), 'no card rows in the reading'));
      return;
    }
    this._noteGood();
    const ledger = LedgerCards.fromLedger(this._readLedger());
    const now = this._now();
    for (const row of usable) {
      const card = this._observeRow(row, usable, ledger, now);
      if (card) yield card;
    }
  }

  _noteDegraded(outcome) {
    this._degraded = true;
    this._outcome = outcome;
    const missing = outcome.kind === NvidiaSmiOutcome.MISSING;
    this._available = !missing;
    this._missingRuns = missing ? this._missingRuns + 1 : 0;
  }

  _noteGood() {
    this._degraded = false;
    this._available = true;
    this._missingRuns = 0;
    this._lastGoodAt = this._now();
  }

  _readLedger() {
    try { return this._ledger() || {}; } catch (_) { return {}; }
  }

  _observeRow(row, rows, { watched, loading, stamps }, now) {
    const index = Number.isInteger(row.index) ? row.index : rows.indexOf(row);
    if (watched.size && !watched.has(index)) return null;
    const card = this._cardFor(index, row);
    card.freeBytes = Number.isFinite(row.freeBytes) ? row.freeBytes : null;
    card.reserveBytes = this._reserveOf({ index, name: card.name, totalBytes: card.totalBytes });
    const ours = card.trackOwnLoad({ stamp: stamps.get(index) || 0, loading: loading.has(index), now, graceMs: this._ownLoadGraceMs });
    if (ours || card.freeBytes === null) return null;
    const next = card.sample(this._confirmSamples);
    if (next) this._commit(card, next);
    return card;
  }

  _cardFor(index, row) {
    let card = this._cards.get(index);
    if (!card) {
      card = new WatchedCard(index, row);
      this._cards.set(index, card);
    }
    card.updateFromRow(row);
    return card;
  }

  _commit(card, next) {
    const prevBand = card.commit(next, this._now());
    this._emit('vram-pressure', { ...card.view(), prevBand });
  }

  async _maybeUnload(card) {
    if (!this._unload || !this._unloadEnabled()) return;
    if (!card.unloadDue(this._now(), this._dwellMs)) return;
    if (!this._isIdle()) return;
    card.markUnloaded(this._now());
    this._unloads += 1;
    const info = { ...card.view(), reason: 'vram-pressure' };
    this._emit('vram-unload', info);
    try { await this._unload('vram-pressure', info); } catch (err) { this._warn('[vram-watchdog] early unload failed:', err); }
  }

  _schedule() {
    if (this._timer) return;
    this._timer = setTimeout(() => { this._timer = null; this.tick(); }, this._nextDelayMs());
    if (this._timer && typeof this._timer.unref === 'function') this._timer.unref();
  }

  _nextDelayMs() {
    if (!this._missingRuns) return this._intervalMs;
    const doubled = this._intervalMs * (2 ** Math.min(this._missingRuns, 20));
    return Math.min(doubled, VramWatchdog.MISSING_RETRY_MAX_MS);
  }

  _warn(message, err) {
    try { this._log.warn(message, err && err.message); } catch (_) {}
  }

  _readHooks(o) {
    const fn = (value, fallback) => (typeof value === 'function' ? value : fallback);
    this._stream = o.stream || NvidiaSmiStream.shared;
    this._ownsStream = typeof o.sample !== 'function';
    this._sample = fn(o.sample, () => this._stream.refresh({ maxAgeMs: this._intervalMs }));
    this._ledger = fn(o.ledger, () => VramCoordinator.shared.snapshot());
    this._reserveOf = fn(o.reserveBytes, () => (Number(o.reserveBytes) > 0
      ? Number(o.reserveBytes) : CudaDevicePicker.PER_CARD_RESERVE_BYTES));
    this._isLoaded = fn(o.isLoaded, () => true);
    this._isIdle = fn(o.isIdle, () => false);
    this._unloadEnabled = fn(o.unloadEnabled, () => false);
    this._unload = fn(o.unload, null);
    this._emit = fn(o.emit, () => {});
    this._now = fn(o.now, () => Date.now());
    this._log = o.log || console;
  }

  _readTimings(o) {
    this._intervalMs = Number(o.intervalMs) > 0 ? Number(o.intervalMs) : VramWatchdog.DEFAULT_INTERVAL_MS;
    this._confirmSamples = Number(o.confirmSamples) >= 1 ? Math.floor(Number(o.confirmSamples)) : VramWatchdog.DEFAULT_CONFIRM_SAMPLES;
    this._dwellMs = Number(o.dwellMs) >= 0 ? Number(o.dwellMs) : VramWatchdog.DEFAULT_DWELL_MS;
    this._ownLoadGraceMs = Number(o.ownLoadGraceMs) >= 0 ? Number(o.ownLoadGraceMs) : VramWatchdog.DEFAULT_OWN_LOAD_GRACE_MS;
  }
}

module.exports = VramWatchdog;
