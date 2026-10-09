const fs = require('fs');
const os = require('os');
const path = require('path');
const AppOwnedDir = require('../AppOwnedDir');
const FileNameSegment = require('../FileNameSegment');
const LlmTraceRecord = require('./LlmTraceRecord');

class LlmTraceWriter {
  static SUBDIR = 'traces';
  static SIDE_FILE = '_side';
  static ROTATE_BYTES = 50 * 1024 * 1024;
  static POINTER_FILE = path.join(os.homedir(), '.lumabrowser', 'traces.json');

  constructor() {
    this._dirOverride = null;
    this._warned = false;
    this._pointerWritten = false;
  }

  directory() {
    return this._dirOverride || AppOwnedDir.resolve(LlmTraceWriter.SUBDIR);
  }

  setDirectory(dir) {
    this._dirOverride = dir || null;
    this._pointerWritten = true;
  }

  fileFor(conversationId) {
    const dir = this.directory();
    if (!dir) return null;
    return path.join(dir, `${FileNameSegment.from(conversationId) || LlmTraceWriter.SIDE_FILE}.jsonl`);
  }

  append(conversationId, record) {
    const file = this.fileFor(conversationId);
    if (!file) return;
    let line;
    try {
      line = LlmTraceRecord.toLine(record);
    } catch (err) {
      this._warnOnce(err);
      return;
    }
    this._appendLine(file, line);
  }

  deleteFor(conversationId) {
    const file = this.fileFor(conversationId);
    if (!file || !FileNameSegment.from(conversationId)) return;
    for (const target of [file, LlmTraceWriter._rotatedPath(file)]) {
      try { fs.rmSync(target, { force: true }); } catch (_) {}
    }
  }

  wipeAll() {
    const dir = this.directory();
    if (!dir) return;
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
  }

  _appendLine(file, line) {
    const dir = path.dirname(file);
    fs.mkdir(dir, { recursive: true }, (mkdirErr) => {
      if (mkdirErr) { this._warnOnce(mkdirErr); return; }
      this._writePointer(dir);
      fs.stat(file, (_statErr, stat) => {
        const append = () => fs.appendFile(file, line, 'utf8', (err) => { if (err) this._warnOnce(err); });
        if (stat && stat.size > LlmTraceWriter.ROTATE_BYTES) this._rotate(file, append);
        else append();
      });
    });
  }

  _rotate(file, then) {
    const previous = LlmTraceWriter._rotatedPath(file);
    fs.rm(previous, { force: true }, () => fs.rename(file, previous, () => then()));
  }

  _writePointer(dir) {
    if (this._pointerWritten) return;
    this._pointerWritten = true;
    try {
      fs.mkdirSync(path.dirname(LlmTraceWriter.POINTER_FILE), { recursive: true });
      fs.writeFileSync(LlmTraceWriter.POINTER_FILE, JSON.stringify({ dir }), 'utf8');
    } catch (_) {}
  }

  _warnOnce(err) {
    if (this._warned) return;
    this._warned = true;
    console.warn(`[llm-trace] disabled after write failure: ${err && err.message}`);
  }

  static _rotatedPath(file) {
    return file.replace(/\.jsonl$/, '.1.jsonl');
  }
}

module.exports = LlmTraceWriter;
