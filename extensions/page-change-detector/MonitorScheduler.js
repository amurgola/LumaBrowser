class MonitorScheduler {
  static MIN_DELAY_MS = 1000;
  static DEFAULT_INTERVAL_MS = 300000;

  constructor({ checker, monitors, broadcast, random = Math.random }) {
    this._checker = checker;
    this._monitors = monitors;
    this._broadcast = broadcast;
    this._random = random;
    this._timers = new Map();
  }

  static nextDelayMs(monitor, random = Math.random) {
    const base = Math.max(MonitorScheduler.MIN_DELAY_MS, monitor.check_interval_ms || MonitorScheduler.DEFAULT_INTERVAL_MS);
    const jitterPct = Math.max(0, Math.min(100, monitor.interval_jitter_percent || 0));
    if (jitterPct === 0) return base;
    const offset = (random() * 2 - 1) * base * (jitterPct / 100);
    return Math.max(MonitorScheduler.MIN_DELAY_MS, Math.round(base + offset));
  }

  start(monitor) {
    this.stop(monitor.id);
    if (!monitor.enabled) return;
    this._arm(monitor);
  }

  stop(monitorId) {
    if (!this._timers.has(monitorId)) return;
    clearTimeout(this._timers.get(monitorId));
    this._timers.delete(monitorId);
  }

  stopAll() {
    for (const timer of this._timers.values()) clearTimeout(timer);
    this._timers.clear();
  }

  isScheduled(monitorId) {
    return this._timers.has(monitorId);
  }

  _arm(monitor) {
    const delay = MonitorScheduler.nextDelayMs(monitor, this._random);
    this._timers.set(monitor.id, setTimeout(() => this._tick(monitor), delay));
    this._monitors.update(monitor.id, { next_run: new Date(Date.now() + delay).toISOString() });
  }

  async _tick(monitor) {
    try {
      await this._checker.check(monitor);
    } finally {
      if (this._timers.has(monitor.id)) {
        this._arm(monitor);
        this._broadcast.emit('scheduled', monitor.id);
      }
    }
  }
}

module.exports = MonitorScheduler;
