const ModelDownload = require('../models/ModelDownload');

class ModelTransfer {
  constructor({ send, download = (opts) => ModelDownload.start(opts) }) {
    this._send = send;
    this._download = download;
    this._canceled = false;
    this._paused = false;
    this._current = null;
  }

  get handle() {
    return { cancel: () => this.cancel(), pause: () => this.pause() };
  }

  get stopped() {
    return this._canceled;
  }

  cancel() {
    this._canceled = true;
    if (this._current) {
      try { this._current.cancel(); } catch (_) {}
    }
  }

  pause() {
    this._paused = true;
    this._canceled = true;
    if (this._current) {
      try { this._current.pause(); } catch (_) {}
    }
  }

  fetch(url, destPath, onEvent, expected = {}) {
    this._current = this._download({ url, destPath, onEvent, ...ModelTransfer._known(expected) });
    return this._current.promise;
  }

  wasStopped(result) {
    return this._canceled || !!(result && (result.canceled || result.paused));
  }

  stopOutcome() {
    if (this._paused) {
      this._send('paused', {});
      return { success: false, paused: true };
    }
    this._send('canceled', {});
    return { success: false, canceled: true };
  }

  static _known(expected) {
    const out = {};
    if (expected && expected.expectedSize > 0) out.expectedSize = expected.expectedSize;
    if (expected && expected.expectedSha256) out.expectedSha256 = expected.expectedSha256;
    return out;
  }
}

module.exports = ModelTransfer;
