class FitRunSignals {
  constructor({ onProgress, shouldCancel } = {}) {
    this._onProgress = onProgress;
    this._shouldCancel = shouldCancel;
    this.cancelled = this.cancelled.bind(this);
  }

  cancelled() {
    try { return !!(this._shouldCancel && this._shouldCancel()); } catch (_) { return false; }
  }

  emit(message) {
    try { if (this._onProgress) this._onProgress(message); } catch (_) {}
  }
}

module.exports = FitRunSignals;
