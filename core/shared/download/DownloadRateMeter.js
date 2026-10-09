class DownloadRateMeter {
  static PROGRESS_THROTTLE_MS = 250;
  static EMA_ALPHA = 0.3;
  static MIN_SAMPLE_MS = 100;

  constructor(startBytes) {
    this._lastBytes = Number(startBytes) || 0;
    this._lastAt = Date.now();
    this._rate = 0;
  }

  sample(received, total) {
    this._updateRate(received);
    return {
      bytesPerSec: this._rate > 0 ? Math.round(this._rate) : 0,
      etaMs: this._etaMs(received, total),
    };
  }

  _updateRate(received) {
    const now = Date.now();
    const elapsed = now - this._lastAt;
    const delta = received - this._lastBytes;
    if (elapsed < DownloadRateMeter.MIN_SAMPLE_MS || delta < 0) return;
    this._rate = this._smooth((delta * 1000) / elapsed);
    this._lastBytes = received;
    this._lastAt = now;
  }

  _smooth(instant) {
    if (this._rate <= 0) return instant;
    return (DownloadRateMeter.EMA_ALPHA * instant) + ((1 - DownloadRateMeter.EMA_ALPHA) * this._rate);
  }

  _etaMs(received, total) {
    const remaining = total > 0 ? Math.max(0, total - received) : 0;
    if (this._rate <= 0 || remaining <= 0) return null;
    return Math.round((remaining / this._rate) * 1000);
  }
}

module.exports = DownloadRateMeter;
