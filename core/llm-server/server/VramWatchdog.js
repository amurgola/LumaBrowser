const NvidiaSmi = require('../../shared/runtime/NvidiaSmi');
const VramCoordinator = require('../../shared/runtime/VramCoordinator');
const CudaDevicePicker = require('../../shared/runtime/CudaDevicePicker');
const LedgerCards = require('./vram-watchdog/LedgerCards');
const WatchedCard = require('./vram-watchdog/WatchedCard');

class VramWatchdog {
  static DEFAULT_INTERVAL_MS = 5000;
  static DEFAULT_CONFIRM_SAMPLES = 2;
  static DEFAULT_DWELL_MS = 30 * 1000;
  static DEFAULT_OWN_LOAD_GRACE_MS = 15 * 1000;
  static UNAVAILABLE_AFTER_EMPTY = 3;

  constructor(options = {}) {
    this._readHooks(options);
    this._readTimings(options);
    this._cards = new Map();
    this._timer = null;
    this._running = false;
    this._ticking = false;
    this._available = true;
    this._emptyRuns = 0;
    this._lastSampleAt = null;
    this._unloads = 0;
  }

  start() {
    if (this._running || !this._available) return false;
    if (!this._isLoaded()) return false;
    this._running = true;
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
      let rows = [];
      try { rows = (await this._sample()) || []; } catch (_) { rows = []; }
      for (const card of this._observeRows(rows)) await this._maybeUnload(card);
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
      running: this._running,
      intervalMs: this._intervalMs,
      lastSampleAt: this._lastSampleAt,
      unloads: this._unloads,
      cards: [...this._cards.values()].sort((a, b) => a.index - b.index).map((c) => c.view()),
    };
  }

  * _observeRows(sampled) {
    const rows = sampled.filter((r) => r && Number(r.totalBytes) > 0);
    this._lastSampleAt = this._now();
    if (!rows.length) {
      this._noteEmptySample();
      return;
    }
    this._emptyRuns = 0;
    this._available = true;
    const ledger = LedgerCards.fromLedger(this._readLedger());
    const now = this._now();
    for (const row of rows) {
      const card = this._observeRow(row, rows, ledger, now);
      if (card) yield card;
    }
  }

  _noteEmptySample() {
    this._emptyRuns += 1;
    if (this._emptyRuns < VramWatchdog.UNAVAILABLE_AFTER_EMPTY) return;
    this._available = false;
    this.stop();
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
    this._timer = setTimeout(() => { this._timer = null; this.tick(); }, this._intervalMs);
    if (this._timer && typeof this._timer.unref === 'function') this._timer.unref();
  }

  _warn(message, err) {
    try { this._log.warn(message, err && err.message); } catch (_) {}
  }

  _readHooks(o) {
    const fn = (value, fallback) => (typeof value === 'function' ? value : fallback);
    this._sample = fn(o.sample, () => NvidiaSmi.queryGpus());
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
