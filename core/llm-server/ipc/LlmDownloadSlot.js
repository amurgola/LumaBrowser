class LlmDownloadSlot {
  static BUSY = 'A model download is already in progress.';
  static IDLE = 'No download in progress.';

  constructor() {
    this._active = null;
  }

  get busy() {
    return !!this._active;
  }

  hold(handle) {
    this._active = handle;
  }

  release() {
    this._active = null;
  }

  cancel() {
    if (!this._active) return;
    try { this._active.cancel(); } catch (_) {}
  }

  pause() {
    if (!this._active) return { success: false, error: LlmDownloadSlot.IDLE };
    try {
      if (typeof this._active.pause === 'function') this._active.pause();
      else this._active.cancel();
    } catch (_) {}
    return { success: true };
  }
}

module.exports = LlmDownloadSlot;
