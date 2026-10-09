const fs = require('fs');
const axios = require('axios');
const ChunkMeta = require('./ChunkMeta');
const PartialFile = require('./PartialFile');
const DownloadHeaders = require('./DownloadHeaders');
const DownloadRateMeter = require('./DownloadRateMeter');
const DownloadVerifier = require('./DownloadVerifier');

class SequentialDownload {
  constructor(job) {
    this._job = job;
    this._offset = 0;
    this._append = false;
    this._total = 0;
    this._received = 0;
  }

  async execute() {
    this._discardSparseParallelPartial();
    this._readResumeOffset();
    const response = await this._request();
    if (!response) return { canceled: true };
    if (response.status === 416) return this._finishAlreadyComplete();
    this._resolveAppendMode(response);
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
    if (this._offset > 0 && this._job.onResume) this._job.onResume(this._offset);
  }

  async _request() {
    const headers = { 'Accept-Encoding': 'identity' };
    if (this._offset > 0) headers.Range = `bytes=${this._offset}-`;
    try {
      return await axios.get(this._job.url, {
        responseType: 'stream',
        headers,
        maxRedirects: 5,
        signal: this._job.controller.signal,
        timeout: 0,
        validateStatus: (status) => (status >= 200 && status < 300) || status === 416,
      });
    } catch (err) {
      if (this._job.canceled()) return null;
      throw new Error(`Download request failed${this._job.forLabel}: ${err.message}`);
    }
  }

  _finishAlreadyComplete() {
    const { partPath, destPath } = this._job;
    fs.renameSync(partPath, destPath);
    return { bytes: PartialFile.size(destPath), resumed: true };
  }

  _resolveAppendMode(response) {
    this._append = response.status === 206 && this._offset > 0;
    if (!this._append) this._offset = 0;
    this._total = DownloadHeaders.totalFromHeaders(response.headers, this._offset);
    this._received = this._offset;
  }

  async _streamToPartial(stream) {
    const out = fs.createWriteStream(this._job.partPath, { flags: this._append ? 'a' : 'w' });
    try {
      await this._pipeWithProgress(stream, out);
      return true;
    } catch (err) {
      try { out.close(); } catch (_) {}
      if (this._job.canceled() || err.canceled) return false;
      throw new Error(`Download interrupted${this._job.forLabel}: ${err.message} (resume on retry)`);
    }
  }

  _pipeWithProgress(stream, out) {
    const { onProgress, controller } = this._job;
    const rateMeter = new DownloadRateMeter(this._offset);
    let lastTick = 0;
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        this._received += chunk.length;
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
    const { verify, partPath, destPath, expectSha, onVerify, onProgress, forLabel } = this._job;
    const total = this._total || this._received;
    if (verify) await DownloadVerifier.verifyPartial({ partPath, total, sha256: expectSha, onVerify, forLabel });
    if (onProgress) onProgress(this._received, total, { bytesPerSec: 0, etaMs: null });
    fs.renameSync(partPath, destPath);
    return { bytes: this._received, resumed: this._append };
  }
}

module.exports = SequentialDownload;
