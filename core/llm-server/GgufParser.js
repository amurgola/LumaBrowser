const fs = require('fs');
const GgufCursor = require('./GgufCursor');
const GgufValueReader = require('./GgufValueReader');
const GgufTensorLayout = require('./GgufTensorLayout');
const GgufHeaderSummary = require('./GgufHeaderSummary');

class GgufParser {
  static DEFAULT_BYTE_CAP = 64 * 1024 * 1024;
  static DEFAULT_TIMEOUT_MS = 4000;
  static EXTENDED_TIMEOUT_MS = 30000;
  static MIN_FILE_BYTES = 24;
  static MAX_TENSOR_RANK = 8;

  static parseHeader(filePath, options = {}) {
    return new GgufParser(options).parse(filePath);
  }

  constructor(options = {}) {
    this._byteCap = options.byteCap || GgufParser.DEFAULT_BYTE_CAP;
    this._timeoutMs = options.timeoutMs || GgufParser.DEFAULT_TIMEOUT_MS;
  }

  async parse(filePath) {
    this._resetState();
    try {
      await this._openFile(filePath);
      await this._readPreamble();
      await this._readMetadataThenTensorScan();
      return this._buildSuccess();
    } catch (err) {
      return this._buildFailure(err);
    } finally {
      await this._closeFile();
    }
  }

  _resetState() {
    this._startedAt = Date.now();
    this._fileHandle = null;
    this._meta = Object.create(null);
    this._coreComplete = false;
    this._tensorScan = null;
    this._tensorScanError = null;
  }

  async _openFile(filePath) {
    this._fileHandle = await fs.promises.open(filePath, 'r');
    const stat = await this._fileHandle.stat();
    if (!stat.size || stat.size < GgufParser.MIN_FILE_BYTES) throw new Error('File too small to be a GGUF');
    this._cursor = new GgufCursor(this._fileHandle, stat.size, this._byteCap, this._startedAt + this._timeoutMs);
  }

  async _readPreamble() {
    const magic = Buffer.from(await this._cursor.take(4)).toString('latin1');
    if (magic !== 'GGUF') throw new Error(`Not a GGUF file (magic="${magic}")`);
    this._version = (await this._cursor.take(4)).readUInt32LE(0);
    if (this._version < 1 || this._version > 3) throw new Error(`Unsupported GGUF version ${this._version}`);
    this._reader = new GgufValueReader(this._cursor, this._version >= 2);
    this._tensorCount = await this._reader.length();
    this._kvCount = await this._reader.length();
  }

  async _readMetadataThenTensorScan() {
    try {
      await this._readMetadata();
      this._markCoreComplete();
      this._tensorScan = await this._readTensorScan();
    } catch (err) {
      if (!this._coreComplete) throw err;
      this._tensorScanError = err && err.message ? err.message : String(err);
    }
  }

  async _readMetadata() {
    for (let i = 0; i < this._kvCount; i++) {
      const key = await this._reader.string();
      const type = await this._reader.uint32();
      if (key.startsWith('tokenizer.')) this._markCoreComplete();
      const value = await this._readValue(key, type);
      if (value !== undefined && GgufHeaderSummary.wants(key)) this._meta[key] = value;
    }
  }

  _readValue(key, type) {
    if (type === GgufValueReader.TYPES.ARRAY) return this._reader.array();
    if (type === GgufValueReader.TYPES.STRING) return this._reader.string();
    if (GgufValueReader.isFixedWidth(type)) return this._reader.scalar(type);
    throw new Error(`Unknown GGUF value type ${type} for key "${key}"`);
  }

  _markCoreComplete() {
    if (this._coreComplete) return;
    this._coreComplete = true;
    this._cursor.extendDeadline(GgufParser.EXTENDED_TIMEOUT_MS);
  }

  async _readTensorScan() {
    if (!GgufTensorLayout.isPlausibleTensorCount(this._tensorCount)) return null;
    const entries = await this._readTensorEntries();
    const alignment = GgufHeaderSummary.numberOrNull(this._meta['general.alignment']);
    const dataStart = GgufTensorLayout.dataSectionStart(this._cursor.position, alignment);
    const dataBytes = Math.max(0, this._cursor.fileSize - dataStart);
    return GgufTensorLayout.scan(entries, dataBytes);
  }

  async _readTensorEntries() {
    const entries = new Array(this._tensorCount);
    for (let i = 0; i < this._tensorCount; i++) entries[i] = await this._readTensorEntry();
    return entries;
  }

  async _readTensorEntry() {
    const name = await this._reader.string();
    const rank = await this._reader.uint32();
    if (rank < 0 || rank > GgufParser.MAX_TENSOR_RANK) throw new Error(`Implausible GGUF tensor rank ${rank}`);
    for (let d = 0; d < rank; d++) await this._reader.length();
    await this._reader.uint32();
    const offset = await this._reader.uint64();
    return { name, offset };
  }

  _buildSuccess() {
    const summary = GgufHeaderSummary.build({
      meta: this._meta,
      version: this._version,
      tensorCount: this._tensorCount,
      kvCount: this._kvCount,
      tensorScan: this._tensorScan,
      tensorScanError: this._tensorScanError,
    });
    return { ...summary, bytesRead: this._cursor.bytesPaged, truncated: false, durationMs: this._elapsedMs() };
  }

  _buildFailure(err) {
    return {
      ok: false,
      error: err && err.message ? err.message : String(err),
      cap: !!(err && err.cap),
      bytesRead: 0,
      durationMs: this._elapsedMs(),
    };
  }

  async _closeFile() {
    if (!this._fileHandle) return;
    try { await this._fileHandle.close(); } catch (_) {}
  }

  _elapsedMs() {
    return Date.now() - this._startedAt;
  }
}

module.exports = GgufParser;
