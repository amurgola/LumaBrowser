const fs = require('fs');
const path = require('path');
const axios = require('axios');
const ChunkMeta = require('./ChunkMeta');
const PartialFile = require('./PartialFile');
const DownloadHeaders = require('./DownloadHeaders');
const DownloadError = require('./DownloadError');
const DownloadRetry = require('./DownloadRetry');
const FreeSpaceGuard = require('./FreeSpaceGuard');
const HubAuth = require('./HubAuth');
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
    headers = null,
    expectedSize = 0,
    expectedSha256 = null,
    checkFreeSpace = true,
    freeSpace = undefined,
    attempts = DownloadRetry.DEFAULT_ATTEMPTS,
    sleep = undefined,
  }) {
    const partPath = PartialFile.pathFor(destPath);
    this._job = {
      url, destPath, partPath, controller, onResume, onProgress, onVerify, parallel, chunkSize, verify, attempts, sleep,
      headers: headers || HubAuth.headersFor(url),
      expectedSize: Number(expectedSize) || 0,
      expectedSha256: expectedSha256 ? String(expectedSha256).toLowerCase() : null,
      metaPath: ChunkMeta.pathFor(partPath),
      forLabel: label ? ` for ${label}` : '',
      canceled: () => (typeof isCanceled === 'function' ? isCanceled() : false),
    };
    this._checkFreeSpace = checkFreeSpace !== false;
    this._freeSpace = freeSpace;
  }

  async execute() {
    fs.mkdirSync(path.dirname(this._job.destPath), { recursive: true });
    if (fs.existsSync(this._job.destPath)) return this._alreadyPresent();
    const info = await this._probe();
    if (!info) return { canceled: true };
    this._assertServedMatchesExpected(info);
    await this._guardFreeSpace(info.total || this._job.expectedSize);
    return this._chooseStrategy(info).execute();
  }

  _alreadyPresent() {
    ChunkMeta.clear(this._job.metaPath);
    return { bytes: PartialFile.size(this._job.destPath), resumed: false, alreadyPresent: true };
  }

  async _probe() {
    try {
      return await DownloadRetry.run(() => this._probeOnce(), {
        attempts: this._job.attempts, isStopped: () => this._job.canceled(), sleep: this._job.sleep,
      });
    } catch (err) {
      if (this._job.canceled()) return null;
      throw err;
    }
  }

  async _probeOnce() {
    const { url, headers, controller, forLabel } = this._job;
    let response;
    try {
      response = await axios.get(url, {
        responseType: 'stream',
        headers: { ...headers, 'Accept-Encoding': 'identity', Range: 'bytes=0-0' },
        maxRedirects: 5,
        signal: controller.signal,
        timeout: 0,
        validateStatus: (status) => status === 200 || status === 206,
      });
    } catch (err) {
      throw DownloadError.fromRequest(err, { url, forLabel });
    }
    try { response.data.destroy(); } catch (_) {}
    return ResumableDownload._probeInfo(response);
  }

  static _probeInfo(response) {
    const sha256 = DownloadHeaders.sha256FromHeaders(response.headers);
    if (response.status === 206) {
      return { total: DownloadHeaders.totalFromHeaders(response.headers, 0), ranged: true, sha256 };
    }
    return { total: Number(response.headers['content-length']) || 0, ranged: false, sha256 };
  }

  _assertServedMatchesExpected(info) {
    const { expectedSize, expectedSha256, forLabel } = this._job;
    if (expectedSize > 0 && info.total > 0 && info.total !== expectedSize) {
      throw DownloadError.integrity(
        `Download refused${forLabel}: the listing says ${expectedSize} bytes but the server offers ${info.total}. The repo may have changed; refresh and try again.`);
    }
    if (expectedSha256 && info.sha256 && info.sha256 !== expectedSha256) {
      throw DownloadError.integrity(
        `Download refused${forLabel}: the listing's sha256 and the served file's sha256 disagree. The repo may have changed; refresh and try again.`);
    }
  }

  async _guardFreeSpace(total) {
    if (!this._checkFreeSpace || !(total > 0)) return;
    const need = Math.max(0, total - this._bytesOnDisk(total));
    const options = { forLabel: this._job.forLabel };
    if (this._freeSpace) options.freeSpace = this._freeSpace;
    await FreeSpaceGuard.assert(path.dirname(this._job.destPath), need, options);
  }

  _bytesOnDisk(total) {
    const { metaPath, partPath, chunkSize } = this._job;
    const meta = ChunkMeta.load(metaPath, total, chunkSize);
    if (!meta) return Math.min(PartialFile.size(partPath), total);
    return meta.done.reduce((sum, done, i) => sum + (done ? Math.min(chunkSize, total - i * chunkSize) : 0), 0);
  }

  _chooseStrategy(info) {
    const { verify, expectedSha256, expectedSize } = this._job;
    const job = { ...this._job, total: info.total || expectedSize, expectSha: verify ? (expectedSha256 || info.sha256) : null };
    const parallelWorthIt = info.ranged && info.total && job.parallel > 1 && info.total > job.chunkSize;
    return parallelWorthIt ? new ParallelDownload(job) : new SequentialDownload(job);
  }
}

module.exports = ResumableDownload;
