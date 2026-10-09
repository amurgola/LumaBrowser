const fs = require('fs');
const axios = require('axios');
const ChunkMeta = require('./ChunkMeta');
const PartialFile = require('./PartialFile');
const DownloadRateMeter = require('./DownloadRateMeter');
const DownloadVerifier = require('./DownloadVerifier');

class ParallelDownload {
  static CHUNK_RETRIES = 3;
  static WRITE_QUEUE_HIGH_WATER = 4 * 1024 * 1024;

  constructor(job) {
    this._job = job;
    this._meta = null;
    this._doneBytes = 0;
    this._resumed = false;
    this._pending = [];
    this._cursor = 0;
    this._failure = null;
    this._inflight = new Map();
    this._fileHandle = null;
    this._rateMeter = null;
    this._lastTick = 0;
  }

  async execute() {
    this._loadOrPlanMeta();
    this._countCompletedBytes();
    this._collectPendingChunks();
    if (this._pending.length === 0) return this._finishAlreadyComplete();
    await this._openPreallocatedPartial();
    await this._runWorkers();
    return this._finish();
  }

  _loadOrPlanMeta() {
    const { metaPath, partPath, total, chunkSize } = this._job;
    this._meta = ChunkMeta.load(metaPath, total, chunkSize);
    if (this._meta) return;
    this._meta = ChunkMeta.plan(total, chunkSize);
    this._adoptContiguousPrefix(PartialFile.size(partPath));
  }

  _adoptContiguousPrefix(have) {
    const { total, chunkSize, partPath } = this._job;
    if (have > total) {
      try { fs.unlinkSync(partPath); } catch (_) {}
      return;
    }
    if (have <= 0) return;
    for (let i = 0; (i + 1) * chunkSize <= have; i++) this._meta.done[i] = true;
    if (have === total) this._meta.done[this._meta.done.length - 1] = true;
  }

  _countCompletedBytes() {
    this._meta.done.forEach((done, i) => { if (done) this._doneBytes += this._chunkBytes(i); });
    this._resumed = this._doneBytes > 0;
    if (this._resumed && this._job.onResume) this._job.onResume(this._doneBytes);
  }

  _collectPendingChunks() {
    this._meta.done.forEach((done, i) => { if (!done) this._pending.push(i); });
  }

  async _finishAlreadyComplete() {
    const { total, onProgress } = this._job;
    await this._verifyAndPublish();
    if (onProgress) onProgress(total, total, { bytesPerSec: 0, etaMs: null });
    return { bytes: total, resumed: true };
  }

  async _openPreallocatedPartial() {
    const { partPath, total, forLabel } = this._job;
    this._fileHandle = await fs.promises.open(partPath, fs.existsSync(partPath) ? 'r+' : 'w+');
    try {
      await this._fileHandle.truncate(total);
    } catch (err) {
      await this._fileHandle.close().catch(() => {});
      throw new Error(`Download failed${forLabel}: cannot preallocate ${total} bytes: ${err.message}`);
    }
    this._rateMeter = new DownloadRateMeter(this._doneBytes);
  }

  async _runWorkers() {
    const workerCount = Math.min(this._job.parallel, this._pending.length);
    try {
      await Promise.all(Array.from({ length: workerCount }, () => this._worker()));
    } finally {
      await this._fileHandle.close().catch(() => {});
    }
  }

  async _worker() {
    while (!this._failure && !this._isStopped()) {
      if (this._cursor >= this._pending.length) return;
      const index = this._pending[this._cursor++];
      const outcome = await this._fetchChunkWithRetries(index);
      if (outcome === 'stopped') return;
      if (outcome instanceof Error) { this._failure = outcome; return; }
      this._markChunkDone(index);
    }
  }

  async _fetchChunkWithRetries(index) {
    let lastError = null;
    for (let attempt = 1; attempt <= ParallelDownload.CHUNK_RETRIES; attempt++) {
      try {
        await this._fetchChunk(index);
        return 'ok';
      } catch (err) {
        this._inflight.delete(index);
        lastError = err;
        if (this._isStopped()) return 'stopped';
      }
    }
    return lastError;
  }

  _markChunkDone(index) {
    this._inflight.delete(index);
    this._doneBytes += this._chunkBytes(index);
    this._meta.done[index] = true;
    ChunkMeta.save(this._job.metaPath, this._meta);
    this._tickProgress(false);
  }

  async _fetchChunk(index) {
    const start = index * this._job.chunkSize;
    const response = await this._requestRange(start, start + this._chunkBytes(index) - 1);
    this._inflight.set(index, 0);
    try {
      await this._writeStreamAt(response.data, index, start);
      this._assertChunkComplete(index);
    } finally {
      try { response.data.destroy(); } catch (_) {}
    }
  }

  _requestRange(start, end) {
    return axios.get(this._job.url, {
      responseType: 'stream',
      headers: { 'Accept-Encoding': 'identity', Range: `bytes=${start}-${end}` },
      maxRedirects: 5,
      signal: this._job.controller.signal,
      timeout: 0,
      validateStatus: (status) => status === 206,
    });
  }

  _writeStreamAt(stream, index, start) {
    return new Promise((resolve, reject) => {
      let written = start;
      let queued = 0;
      let pipeline = Promise.resolve();
      stream.on('data', (buf) => {
        const at = written;
        written += buf.length;
        queued += buf.length;
        if (queued > ParallelDownload.WRITE_QUEUE_HIGH_WATER) stream.pause();
        pipeline = pipeline.then(async () => {
          await this._fileHandle.write(buf, 0, buf.length, at);
          queued -= buf.length;
          if (queued <= ParallelDownload.WRITE_QUEUE_HIGH_WATER) stream.resume();
        }).catch(reject);
        this._inflight.set(index, written - start);
        this._tickProgress(false);
      });
      stream.on('error', reject);
      stream.on('end', () => { pipeline.then(resolve, reject); });
    });
  }

  _assertChunkComplete(index) {
    const got = this._inflight.get(index) || 0;
    if (got !== this._chunkBytes(index)) {
      throw new Error(`chunk ${index} short read (${got}/${this._chunkBytes(index)} bytes)`);
    }
  }

  async _finish() {
    if (this._isStopped()) return { canceled: true };
    if (this._failure) {
      throw new Error(`Download interrupted${this._job.forLabel}: ${this._failure.message} (resume on retry)`);
    }
    await this._verifyAndPublish();
    this._tickProgress(true);
    return { bytes: this._job.total, resumed: this._resumed };
  }

  async _verifyAndPublish() {
    const { verify, partPath, metaPath, destPath, total, expectSha, onVerify, forLabel } = this._job;
    if (verify) await DownloadVerifier.verifyPartial({ partPath, total, sha256: expectSha, onVerify, forLabel });
    ChunkMeta.clear(metaPath);
    fs.renameSync(partPath, destPath);
  }

  _tickProgress(force) {
    const { onProgress, total } = this._job;
    if (!onProgress) return;
    const now = Date.now();
    if (!force && now - this._lastTick < DownloadRateMeter.PROGRESS_THROTTLE_MS) return;
    this._lastTick = now;
    let received = this._doneBytes;
    for (const bytes of this._inflight.values()) received += bytes;
    onProgress(received, total, this._rateMeter.sample(received, total));
  }

  _chunkBytes(index) {
    return Math.min(this._job.chunkSize, this._job.total - index * this._job.chunkSize);
  }

  _isStopped() {
    return this._job.canceled() || this._job.controller.signal.aborted;
  }
}

module.exports = ParallelDownload;
