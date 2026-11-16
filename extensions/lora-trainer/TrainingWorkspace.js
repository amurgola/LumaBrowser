const fs = require('fs');

class TrainingWorkspace {
  constructor({ paths, fsOps = fs }) {
    this._paths = paths;
    this._fs = fsOps;
  }

  clear(jobId, { succeeded }) {
    this._remove(this._paths.datasetDir(jobId));
    this._remove(this._paths.outputDir(jobId));
    this._remove(this._paths.configPath(jobId));
    if (succeeded) this._remove(this._paths.logPath(jobId));
  }

  clearAbandoned(jobIds) {
    for (const jobId of jobIds) this.clear(jobId, { succeeded: false });
  }

  _remove(target) {
    try {
      this._fs.rmSync(target, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
    } catch (_) {}
  }
}

module.exports = TrainingWorkspace;
