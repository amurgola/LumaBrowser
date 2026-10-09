class GgufCursor {
  static PAGE_BYTES = 256 * 1024;

  constructor(fileHandle, fileSize, byteCap, deadline) {
    this._fileHandle = fileHandle;
    this._fileSize = fileSize;
    this._byteCap = byteCap;
    this._deadline = deadline;
    this._position = 0;
    this._bufferBase = 0;
    this._buffer = Buffer.alloc(0);
    this._bytesPaged = 0;
  }

  get position() {
    return this._position;
  }

  get fileSize() {
    return this._fileSize;
  }

  get bytesPaged() {
    return this._bytesPaged;
  }

  extendDeadline(extraMs) {
    this._deadline = Math.max(this._deadline, Date.now() + extraMs);
  }

  async take(byteCount) {
    await this._ensureBuffered(byteCount);
    const start = this._position - this._bufferBase;
    const out = this._buffer.subarray(start, start + byteCount);
    this._position += byteCount;
    return out;
  }

  skip(byteCount) {
    this._position += byteCount;
    if (this._position > this._fileSize) throw new Error('GGUF skip ran past end of file');
    if (this._position <= this._bufferEnd()) return;
    this._buffer = Buffer.alloc(0);
    this._bufferBase = this._position;
  }

  async skipStringArray(count, lengthBytes, maxStringBytes) {
    let skipped = 0;
    while (skipped < count) {
      await this._ensureBuffered(lengthBytes);
      skipped = this._skipBufferedStrings(skipped, count, lengthBytes, maxStringBytes);
    }
  }

  _skipBufferedStrings(skipped, count, lengthBytes, maxStringBytes) {
    while (skipped < count) {
      const at = this._position - this._bufferBase;
      if (at + lengthBytes > this._buffer.length) break;
      const stringBytes = this._readBufferedLength(at, lengthBytes);
      if (stringBytes < 0 || stringBytes > maxStringBytes) {
        throw new Error(`Implausible GGUF array string length ${stringBytes}`);
      }
      this._position += lengthBytes;
      this.skip(stringBytes);
      skipped++;
      if (this._position - this._bufferBase >= this._buffer.length) break;
    }
    return skipped;
  }

  _readBufferedLength(at, lengthBytes) {
    return lengthBytes === 8
      ? Number(this._buffer.readBigUInt64LE(at))
      : this._buffer.readUInt32LE(at);
  }

  async _ensureBuffered(byteCount) {
    this._dropConsumedPrefix();
    while (this._bufferEnd() < this._position + byteCount) {
      this._assertCanPageMore();
      await this._pageIn();
    }
  }

  _dropConsumedPrefix() {
    if (this._position - this._bufferBase <= GgufCursor.PAGE_BYTES) return;
    this._buffer = this._buffer.subarray(this._position - this._bufferBase);
    this._bufferBase = this._position;
  }

  _assertCanPageMore() {
    if (Date.now() > this._deadline) throw new Error('Timed out reading GGUF header');
    if (this._bufferEnd() >= this._fileSize) throw new Error('Unexpected end of file in GGUF header');
    if (this._bytesPaged >= this._byteCap) {
      const error = new Error('GGUF metadata exceeds byte cap before wanted keys were found');
      error.cap = true;
      throw error;
    }
  }

  async _pageIn() {
    const end = this._bufferEnd();
    const want = Math.min(GgufCursor.PAGE_BYTES, this._fileSize - end, this._byteCap - this._bytesPaged);
    const page = Buffer.allocUnsafe(want);
    const { bytesRead } = await this._fileHandle.read(page, 0, want, end);
    if (bytesRead <= 0) throw new Error('Short read while paging GGUF header');
    const chunk = page.subarray(0, bytesRead);
    this._buffer = this._buffer.length === 0 ? chunk : Buffer.concat([this._buffer, chunk]);
    this._bytesPaged += bytesRead;
  }

  _bufferEnd() {
    return this._bufferBase + this._buffer.length;
  }
}

module.exports = GgufCursor;
