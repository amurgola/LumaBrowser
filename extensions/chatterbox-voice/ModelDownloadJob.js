const path = require('path');
const CoreRequire = require('./CoreRequire');

class ModelDownloadJob {
  constructor({ entry, modelsDir, stopEngine }) {
    this._entry = entry;
    this._modelsDir = modelsDir;
    this._stopEngine = stopEngine;
    this._handle = null;
    this.state = { id: entry.id, phase: 'download', received: 0, total: entry.sizeBytes, bytesPerSec: 0, done: false, error: null, startedAt: Date.now() };
  }

  start() {
    const ModelDownload = CoreRequire.load('llm-server/models/ModelDownload');
    this._handle = ModelDownload.start({
      url: this._entry.url,
      destPath: path.join(this._modelsDir, this._entry.file),
      onEvent: (type, payload) => this._onEvent(type, payload),
    });
    this.finished = this._settle(this._handle.promise);
    return this;
  }

  cancel() {
    if (!this._handle || this.state.done) return false;
    this._handle.cancel();
    return true;
  }

  async _settle(promise) {
    const job = this.state;
    try {
      const r = await promise;
      if (r && r.success) job.phase = 'done';
      else { job.phase = r && r.canceled ? 'canceled' : 'error'; job.error = r && r.canceled ? null : 'Download failed.'; }
    } catch (err) {
      job.phase = 'error';
      job.error = err.message;
    } finally {
      job.done = true;
      await this._stopEngine().catch(() => {});
    }
  }

  _onEvent(type, payload) {
    const job = this.state;
    if (type === 'download') {
      job.received = payload.received || 0;
      job.total = payload.total || job.total;
      job.bytesPerSec = payload.bytesPerSec || 0;
    } else if (type === 'verify' || type === 'finalize') {
      job.phase = type;
    }
  }
}

module.exports = ModelDownloadJob;
