class CrashTraceHeartbeat {
  static FAST_MS = 500;
  static FAST_WINDOW_MS = 180 * 1000;
  static SLOW_MS = 30 * 1000;
  static LAG_REPORT_MS = 400;
  static RSS_EVERY_FAST_TICKS = 10;

  constructor(write, start, proc = process) {
    this._write = write;
    this._start = start;
    this._proc = proc;
    this._timer = null;
    this._ticks = 0;
    this._expected = 0;
  }

  start() {
    this._expected = Date.now() + CrashTraceHeartbeat.FAST_MS;
    this._schedule(CrashTraceHeartbeat.FAST_MS);
  }

  stop() {
    clearTimeout(this._timer);
    this._timer = null;
  }

  _tick() {
    const now = Date.now();
    const lag = now - this._expected;
    const period = now - this._start < CrashTraceHeartbeat.FAST_WINDOW_MS ? CrashTraceHeartbeat.FAST_MS : CrashTraceHeartbeat.SLOW_MS;
    this._ticks++;
    this._write(this._line(lag, period));
    this._expected = now + period;
    this._schedule(period);
  }

  _line(lag, period) {
    const rss = Math.round(this._proc.memoryUsage().rss / (1024 * 1024));
    if (lag > CrashTraceHeartbeat.LAG_REPORT_MS) return `hb lag=${lag}ms rss=${rss}MB`;
    if (period === CrashTraceHeartbeat.SLOW_MS || this._ticks % CrashTraceHeartbeat.RSS_EVERY_FAST_TICKS === 0) return `hb rss=${rss}MB`;
    return 'hb';
  }

  _schedule(delay) {
    this._timer = setTimeout(() => this._tick(), delay);
    this._timer.unref?.();
  }
}

module.exports = CrashTraceHeartbeat;
