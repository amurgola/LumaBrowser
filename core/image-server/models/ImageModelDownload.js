const path = require('path');
const ResumableDownload = require('../../shared/download/ResumableDownload');

class ImageModelDownload {
  static create({ files, dir, onEvent }) {
    const download = new ImageModelDownload({ files, dir, onEvent });
    return { promise: download._run(), cancel: () => download._cancel() };
  }

  constructor({ files, dir, onEvent }) {
    if (!Array.isArray(files) || files.length === 0) throw new Error('ImageModelDownload: files[] is required');
    this._files = files;
    this._dir = dir;
    this._onEvent = onEvent;
    this._controller = new AbortController();
    this._canceled = false;
    this._completed = [];
  }

  async _run() {
    for (let index = 0; index < this._files.length; index++) {
      if (this._canceled) return this._canceledResult();
      const result = await this._downloadOne(this._files[index], index);
      if (this._canceled || (result && result.canceled)) return this._canceledResult();
      this._recordDone(this._files[index], result.bytes);
    }
    this._emit('finalize', { dir: this._dir, files: this._completed });
    return { success: true, dir: this._dir, files: this._completed };
  }

  _downloadOne(file, index) {
    this._emit('file-start', { role: file.role, file: path.basename(file.destPath), destPath: file.destPath, index, total: this._files.length });
    return ResumableDownload.download({
      url: file.url,
      destPath: file.destPath,
      controller: this._controller,
      isCanceled: () => this._canceled,
      label: file.role,
      onResume: (have) => this._emit('resume', { role: file.role, have }),
      onProgress: (received, total, stats) => this._emit('download', ImageModelDownload._progressPayload(file.role, received, total, stats)),
      onVerify: (read, total) => this._emit('verify', { role: file.role, read, total }),
    });
  }

  _recordDone(file, bytes) {
    this._completed.push({ role: file.role, destPath: file.destPath, bytes });
    this._emit('file-done', { role: file.role, destPath: file.destPath, bytes });
  }

  _canceledResult() {
    return { success: false, canceled: true, completed: this._completed };
  }

  _cancel() {
    this._canceled = true;
    try {
      this._controller.abort();
    } catch (_) {}
  }

  _emit(type, payload) {
    if (this._onEvent) this._onEvent(type, payload);
  }

  static _progressPayload(role, received, total, stats) {
    return {
      role,
      received,
      total,
      bytesPerSec: (stats && stats.bytesPerSec) || 0,
      etaMs: stats && stats.etaMs != null ? stats.etaMs : null,
    };
  }
}

module.exports = ImageModelDownload;
