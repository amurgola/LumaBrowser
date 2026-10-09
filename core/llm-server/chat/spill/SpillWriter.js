const fs = require('fs');
const path = require('path');
const FileNameSegment = require('../FileNameSegment');
const GitExclude = require('./GitExclude');

class SpillWriter {
  static GIT_EXCLUDE_COMMENT = 'LumaBrowser spilled tool results';

  constructor({ location, turnId, maxBytes }) {
    this.dir = location.dir;
    this.readable = location.readable;
    this._displayBase = location.displayBase;
    this._gitRoot = location.gitRoot;
    this._excludePattern = location.excludePattern;
    this._turnSegment = FileNameSegment.from(turnId || Date.now()) || '_';
    this._maxBytes = maxBytes;
    this._prepared = false;
  }

  write(tool, seq, content, ext = 'json') {
    if (!this._prepare()) return null;
    const body = String(content == null ? '' : content);
    const bytes = Buffer.byteLength(body, 'utf8');
    if (bytes > this._maxBytes) return null;
    const name = this._fileName(tool, seq, ext);
    const absPath = path.join(this.dir, name);
    try {
      fs.writeFileSync(absPath, body, 'utf8');
    } catch (_) {
      return null;
    }
    const displayPath = this.readable ? `${this._displayBase}/${name}` : absPath;
    return { absPath, displayPath, bytes, readable: this.readable };
  }

  _fileName(tool, seq, ext) {
    const extension = ext === 'txt' ? 'txt' : 'json';
    return `${this._turnSegment}_${Number(seq) || 0}_${FileNameSegment.from(tool) || '_'}.${extension}`;
  }

  _prepare() {
    if (this._prepared) return true;
    if (!this.dir) return false;
    try {
      fs.mkdirSync(this.dir, { recursive: true });
      if (this._gitRoot) GitExclude.addOnce(this._gitRoot, this._excludePattern, SpillWriter.GIT_EXCLUDE_COMMENT);
      this._prepared = true;
      return true;
    } catch (_) {
      return false;
    }
  }
}

module.exports = SpillWriter;
