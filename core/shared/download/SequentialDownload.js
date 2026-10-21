const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const ChunkMeta = require('./ChunkMeta');
const PartialFile = require('./PartialFile');
const DownloadHeaders = require('./DownloadHeaders');
const DownloadRateMeter = require('./DownloadRateMeter');
const DownloadVerifier = require('./DownloadVerifier');
const DownloadError = require('./DownloadError');
const DownloadRetry = require('./DownloadRetry');
const DownloadPublish = require('./DownloadPublish');

class SequentialDownload {
  constructor(job) {
    this._job = job;
    this._offset = 0;
    this._append = false;
    this._total = 0;
    this._received = 0;
    this._hash = null;
    this._resumeReported = false;
  }

  async execute() {
    this._discardSparseParallelPartial();
    return DownloadRetry.run(() => this._attempt(), {
      attempts: this._job.attempts,
      isStopped: () => this._job.canceled(),
      sleep: this._job.sleep,
    });
  }

  async _attempt() {
    this._readResumeOffset();
    const response = await this._request();
    if (!response) return { canceled: true };
    if (response.status === 416) return this._finishAlreadyComplete(response);
    this._resolveAppendMode(response);
    await this._prepareHash();
    const streamed = await this._streamToPartial(response.data);
    if (!streamed) return { canceled: true };
    return this._finish();
  }

  _discardSparseParallelPartial() {
    const { metaPath, partPath } = this._job;
    if (!ChunkMeta.exists(metaPath)) return;
    ChunkMeta.clear(metaPath);
    try { fs.unlinkSync(partPath); } catch (_) {}
  }

  _readResumeOffset() {
    this._offset = PartialFile.size(this._job.partPath);
    if (this._offset > 0 && !this._resumeReported && this._job.onResume) {
      this._resumeReported = true;
      this._job.onResume(this._offset);
    }
  }

  async _request() {
    const { url, headers = {}, controller, forLabel } = this._job;
    const requestHeaders = { ...headers, 'Accept-Encoding': 'identity' };
    if (this._offset > 0) requestHeaders.Range = `bytes=${this._offset}-`;
    try {
      return await axios.get(url, {
        responseType: 'stream',
        headers: requestHeaders,
        maxRedirects: 5,
        signal: controller.signal,
        timeout: 0,
        validateStatus: (status) => (status >= 200 && status < 300) || status === 416,
      });
    } catch (err) {
      if (this._job.canceled()) return null;
      throw DownloadError.fromRequest(err, { url, forLabel });
    }
  }

  _finishAlreadyComplete(response) {
    this._append = true;
    this._received = this._offset;
    this._total = DownloadHeaders.totalFromHeaders(response.headers, 0) || this._job.total || 0;
    this._hash = null;
    return this._finish();
  }

  _resolveAppendMode(response) {
    this._append = response.status === 206 && this._offset > 0;
    if (!this._append) this._offset = 0;
    this._total = DownloadHeaders.totalFromHeaders(response.headers, this._offset) || this._job.total || 0;
    this._received = this._offset;
  }

  async _prepareHash() {
    this._hash = null;
    if (!this._job.verify || !this._job.expectSha) return;
    this._hash = crypto.createHash('sha256');
    if (this._append && this._offset > 0) await this._hashPrefix();
  }

  _hashPrefix() {
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(this._job.partPath, { start: 0, end: this._offset - 1 });
      stream.on('data', (chunk) => this._hash.update(chunk));
      stream.on('error', reject);
      stream.on('end', resolve);
    });
  }

  async _streamToPartial(stream) {
    const out = fs.createWriteStream(this._job.partPath, { flags: this._append ? 'a' : 'w' });
    try {
      await this._pipeWithProgress(stream, out);
      return true;
    } catch (err) {
      await SequentialDownload._settle(out);
      if (this._job.canceled() || err.canceled) return false;
      throw new DownloadError(`Download interrupted${this._job.forLabel}: ${err.message} (resume on retry)`, {
        code: DownloadError.NETWORK, retryable: true,
      });
    }
  }

  static _settle(out) {
    return new Promise((resolve) => {
      if (out.destroyed || out.closed) return resolve();
      out.once('close', resolve);
      out.once('error', resolve);
      try { out.end(); } catch (_) { resolve(); }
    });
  }

  _pipeWithProgress(stream, out) {
    const { onProgress, controller } = this._job;
    const rateMeter = new DownloadRateMeter(this._offset);
    let lastTick = 0;
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        this._received += chunk.length;
        if (this._hash) this._hash.update(chunk);
        const now = Date.now();
        if (!onProgress || now - lastTick < DownloadRateMeter.PROGRESS_THROTTLE_MS) return;
        lastTick = now;
        onProgress(this._received, this._total, rateMeter.sample(this._received, this._total));
      });
      stream.on('error', reject);
      out.on('error', reject);
      out.on('finish', resolve);
      stream.pipe(out);
      controller.signal.addEventListener('abort', () => {
        stream.destroy();
        out.destroy();
        reject(Object.assign(new Error('canceled'), { canceled: true }));
      }, { once: true });
    });
  }

  async _finish() {
    const { verify, partPath, metaPath, destPath, expectSha, onVerify, onProgress, forLabel } = this._job;
    const total = this._total || this._received;
    if (verify) {
      const digest = this._hash ? this._hash.digest('hex') : null;
      await DownloadVerifier.verifyPartial({ partPath, metaPath, total, sha256: expectSha, digest, onVerify, forLabel });
    }
    if (onProgress) onProgress(this._received, total, { bytesPerSec: 0, etaMs: null });
    await DownloadPublish.publish(partPath, destPath);
    return { bytes: this._received, resumed: this._append };
  }
}

module.exports = SequentialDownload;
