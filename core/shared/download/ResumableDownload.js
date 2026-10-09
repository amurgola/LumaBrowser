const fs = require('fs');
const path = require('path');
const axios = require('axios');
const ChunkMeta = require('./ChunkMeta');
const PartialFile = require('./PartialFile');
const DownloadHeaders = require('./DownloadHeaders');
const ParallelDownload = require('./ParallelDownload');
const SequentialDownload = require('./SequentialDownload');

class ResumableDownload {
  static DEFAULT_PARALLEL = 8;
  static DEFAULT_CHUNK_SIZE = 32 * 1024 * 1024;

  static download(options) {
    return new ResumableDownload(options).execute();
  }

  constructor({
    url, destPath, controller, isCanceled, label, onResume, onProgress, onVerify,
    parallel = ResumableDownload.DEFAULT_PARALLEL,
    chunkSize = ResumableDownload.DEFAULT_CHUNK_SIZE,
    verify = true,
  }) {
    const partPath = PartialFile.pathFor(destPath);
    this._job = {
      url, destPath, partPath, controller, onResume, onProgress, onVerify, parallel, chunkSize, verify,
      metaPath: ChunkMeta.pathFor(partPath),
      forLabel: label ? ` for ${label}` : '',
      canceled: () => (typeof isCanceled === 'function' ? isCanceled() : false),
    };
  }

  async execute() {
    fs.mkdirSync(path.dirname(this._job.destPath), { recursive: true });
    if (fs.existsSync(this._job.destPath)) return this._alreadyPresent();
    const info = await this._probe();
    if (!info) return { canceled: true };
    return this._chooseStrategy(info).execute();
  }

  _alreadyPresent() {
    ChunkMeta.clear(this._job.metaPath);
    return { bytes: PartialFile.size(this._job.destPath), resumed: false, alreadyPresent: true };
  }

  async _probe() {
    try {
      const response = await axios.get(this._job.url, {
        responseType: 'stream',
        headers: { 'Accept-Encoding': 'identity', Range: 'bytes=0-0' },
        maxRedirects: 5,
        signal: this._job.controller.signal,
        timeout: 0,
        validateStatus: (status) => status === 200 || status === 206,
      });
      try { response.data.destroy(); } catch (_) {}
      return ResumableDownload._probeInfo(response);
    } catch (err) {
      if (this._job.canceled()) return null;
      throw new Error(`Download request failed${this._job.forLabel}: ${err.message}`);
    }
  }

  static _probeInfo(response) {
    const sha256 = DownloadHeaders.sha256FromHeaders(response.headers);
    if (response.status === 206) {
      return { total: DownloadHeaders.totalFromHeaders(response.headers, 0), ranged: true, sha256 };
    }
    return { total: Number(response.headers['content-length']) || 0, ranged: false, sha256 };
  }

  _chooseStrategy(info) {
    const job = { ...this._job, total: info.total, expectSha: this._job.verify ? info.sha256 : null };
    const parallelWorthIt = info.ranged && info.total && job.parallel > 1 && info.total > job.chunkSize;
    return parallelWorthIt ? new ParallelDownload(job) : new SequentialDownload(job);
  }
}

module.exports = ResumableDownload;
