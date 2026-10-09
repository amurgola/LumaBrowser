const ResumableDownload = require('../../shared/download/ResumableDownload');

class ModelDownload {
  static start({ url, destPath, onEvent }) {
    const download = new ModelDownload({ url, destPath, onEvent });
    return { promise: download.run(), cancel: () => download.cancel(), pause: () => download.pause() };
  }

  constructor({ url, destPath, onEvent }) {
    this._url = url;
    this._destPath = destPath;
    this._onEvent = typeof onEvent === 'function' ? onEvent : () => {};
    this._controller = new AbortController();
    this._halted = false;
    this._paused = false;
  }

  async run() {
    const result = await ResumableDownload.download(this._transferOptions());
    if (result.canceled) return { success: false, canceled: !this._paused, paused: this._paused };
    this._onEvent('finalize', { destPath: this._destPath, bytes: result.bytes });
    return this._successResult(result);
  }

  cancel() {
    this._halt();
  }

  pause() {
    this._paused = true;
    this._halt();
  }

  _halt() {
    this._halted = true;
    try { this._controller.abort(); } catch (_) {}
  }

  _transferOptions() {
    return {
      url: this._url,
      destPath: this._destPath,
      controller: this._controller,
      isCanceled: () => this._halted,
      onResume: (have) => this._onEvent('resume', { have }),
      onProgress: (received, total, stats) => this._onEvent('download', ModelDownload._progressPayload(received, total, stats)),
      onVerify: (read, total) => this._onEvent('verify', { read, total }),
    };
  }

  _successResult(result) {
    const out = { success: true, destPath: this._destPath, resumed: !!result.resumed };
    if (result.alreadyPresent) out.alreadyPresent = true;
    return out;
  }

  static _progressPayload(received, total, stats) {
    return {
      received,
      total,
      bytesPerSec: (stats && stats.bytesPerSec) || 0,
      etaMs: (stats && stats.etaMs) != null ? stats.etaMs : null,
    };
  }
}

module.exports = ModelDownload;
