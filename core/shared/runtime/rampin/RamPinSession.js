const fsp = require('fs').promises;

class RamPinSession {
  static GIB = 1024 * 1024 * 1024;
  static LOCK_CHUNK_BYTES = 128 * 1024 * 1024;
  static READ_BUFFER_BYTES = 32 * 1024 * 1024;
  static LOCK_CONCURRENCY = 3;
  static PROGRESS_STEP_BYTES = RamPinSession.GIB;
  static ERROR_EXIT_DELAY_MS = 250;

  constructor({
    post,
    createLock,
    exit,
    lockChunkBytes = RamPinSession.LOCK_CHUNK_BYTES,
    readBufferBytes = RamPinSession.READ_BUFFER_BYTES,
    lockConcurrency = RamPinSession.LOCK_CONCURRENCY,
    progressStepBytes = RamPinSession.PROGRESS_STEP_BYTES,
  }) {
    this._post = post;
    this._createLock = createLock;
    this._exit = exit;
    this._lockChunkBytes = lockChunkBytes;
    this._readBufferBytes = readBufferBytes;
    this._lockConcurrency = lockConcurrency;
    this._progressStepBytes = progressStepBytes;
    this._pinning = false;
    this._lockedBytes = 0;
    this._lastReportedBytes = 0;
    this._totalBytes = 0;
  }

  handle(message) {
    if (!message || typeof message.type !== 'string') return Promise.resolve();
    if (message.type === 'pin') return this._startPin(message.files);
    if (message.type === 'unpin') this._exit(0);
    return Promise.resolve();
  }

  _startPin(files) {
    if (this._pinning) return Promise.resolve();
    this._pinning = true;
    return this._pinAll(Array.isArray(files) ? files : []).catch((err) => this._fail(err));
  }

  async _pinAll(requested) {
    const files = await this._statFiles(requested);
    this._totalBytes = files.reduce((sum, file) => sum + file.sizeBytes, 0);
    const lock = this._createLock();
    lock.prepare(this._totalBytes);
    const started = Date.now();
    for (const file of files) {
      await this._warmAndLock(file, lock.mapFile(file), lock);
    }
    this._post({ type: 'pinned', totalBytes: this._totalBytes, seconds: (Date.now() - started) / 1000 });
  }

  async _statFiles(requested) {
    if (!requested.length) throw new Error('No files to pin.');
    const files = [];
    for (const file of requested) {
      const stat = await fsp.stat(file.path);
      if (!stat.isFile()) throw new Error(`Not a file: ${file.path}`);
      files.push({ path: file.path, sizeBytes: stat.size });
    }
    return files;
  }

  async _warmAndLock(file, base, lock) {
    const handle = await fsp.open(file.path, 'r');
    const buffer = Buffer.allocUnsafe(Math.min(this._readBufferBytes, Math.max(file.sizeBytes, 1)));
    try {
      const pending = [];
      for (let start = 0; start < file.sizeBytes; start += this._lockChunkBytes) {
        const end = Math.min(start + this._lockChunkBytes, file.sizeBytes);
        await this._readRange(handle, buffer, file.path, start, end);
        pending.push(this._lockRange(lock, base, start, end - start));
        if (pending.length >= this._lockConcurrency) await pending.shift();
      }
      await Promise.all(pending);
    } finally {
      await handle.close();
    }
  }

  async _readRange(handle, buffer, filePath, start, end) {
    let position = start;
    while (position < end) {
      const { bytesRead } = await handle.read(buffer, 0, Math.min(buffer.length, end - position), position);
      if (bytesRead <= 0) throw new Error(`Short read at ${position} of ${filePath} (file changed under us?)`);
      position += bytesRead;
    }
  }

  _lockRange(lock, base, offset, length) {
    return lock.lockAsync(base + offset, length).then(() => this._recordLocked(length));
  }

  _recordLocked(length) {
    this._lockedBytes += length;
    const stepReached = this._lockedBytes - this._lastReportedBytes >= this._progressStepBytes;
    if (!stepReached && this._lockedBytes !== this._totalBytes) return;
    this._lastReportedBytes = this._lockedBytes;
    this._post({ type: 'progress', lockedBytes: this._lockedBytes, totalBytes: this._totalBytes });
  }

  _fail(err) {
    this._post({ type: 'error', message: (err && err.message) || String(err) });
    setTimeout(() => this._exit(0), RamPinSession.ERROR_EXIT_DELAY_MS);
  }
}

module.exports = RamPinSession;
