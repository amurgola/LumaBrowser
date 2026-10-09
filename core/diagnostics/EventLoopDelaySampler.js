const { monitorEventLoopDelay } = require('perf_hooks');

class EventLoopDelaySampler {
  static BUCKET_MS = 100;
  static RESOLUTION_MS = 5;
  static NS_PER_MS = 1e6;

  constructor({ bucketMs = EventLoopDelaySampler.BUCKET_MS, now = Date.now } = {}) {
    this._bucketMs = bucketMs;
    this._now = now;
    this._series = [];
    this._histogram = null;
    this._timer = null;
  }

  start() {
    this._startedAt = this._now();
    this._histogram = monitorEventLoopDelay({ resolution: EventLoopDelaySampler.RESOLUTION_MS });
    this._histogram.enable();
    this._timer = setInterval(() => this._sampleBucket(), this._bucketMs);
  }

  stop() {
    clearInterval(this._timer);
    if (this._histogram) this._histogram.disable();
    return this._series;
  }

  _sampleBucket() {
    const h = this._histogram;
    this._series.push({
      t: this._now() - this._startedAt,
      maxMs: h.max / EventLoopDelaySampler.NS_PER_MS,
      meanMs: h.mean / EventLoopDelaySampler.NS_PER_MS,
    });
    h.reset();
  }
}

module.exports = EventLoopDelaySampler;
