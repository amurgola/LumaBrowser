const fs = require('fs');
const path = require('path');

class OutputCapture {
  static SPILL_PREFIX = 'luma-cmd-';

  constructor({ maxBytes, spillDir, onOutput }) {
    this._maxBytes = maxBytes;
    this._spillDir = spillDir;
    this._onOutput = typeof onOutput === 'function' ? onOutput : null;
    this._chunks = [];
    this._held = 0;
    this._total = 0;
    this._spillFd = null;
    this._spillPath = null;
  }

  push(data) {
    const b = Buffer.isBuffer(data) ? data : Buffer.from(String(data));
    this._total += b.length;
    this._notify(b);
    this._spill(b);
    this._hold(b);
  }

  detach() {
    if (this._spillFd === null && this._spillPath === null) {
      this._openSpill();
      for (const c of this._chunks) this._spillWrite(c);
    }
    return this._spillPath;
  }

  snapshot() {
    return { text: this._tailText(), totalBytes: this._total, capturedBytes: this._held, spillPath: this._spillPath };
  }

  finish() {
    if (this._spillFd !== null) {
      try { fs.closeSync(this._spillFd); } catch (_) {}
      this._spillFd = null;
    }
    return this.snapshot();
  }

  _notify(b) {
    if (!this._onOutput) return;
    try { this._onOutput(b.toString('utf8')); } catch (_) {}
  }

  _spill(b) {
    if (this._spillFd !== null) {
      this._spillWrite(b);
    } else if (this._total > this._maxBytes) {
      this._openSpill();
      for (const c of this._chunks) this._spillWrite(c);
      this._spillWrite(b);
    }
  }

  _hold(b) {
    this._chunks.push(b);
    this._held += b.length;
    while (this._held > this._maxBytes && this._chunks.length > 1) {
      this._held -= this._chunks.shift().length;
    }
  }

  _tailText() {
    const text = Buffer.concat(this._chunks).toString('utf8');
    if (this._total <= this._held) return text;
    const nl = text.indexOf('\n');
    return nl !== -1 && nl < text.length - 1 ? text.slice(nl + 1) : text;
  }

  _openSpill() {
    try {
      fs.mkdirSync(this._spillDir, { recursive: true });
      this._spillPath = path.join(this._spillDir, `${OutputCapture.SPILL_PREFIX}${Date.now()}-${process.pid}-${Math.random().toString(36).slice(2, 8)}.log`);
      this._spillFd = fs.openSync(this._spillPath, 'w');
    } catch (_) {
      this._spillFd = null;
      this._spillPath = null;
    }
  }

  _spillWrite(b) {
    if (this._spillFd === null) return;
    try { fs.writeSync(this._spillFd, b); } catch (_) {}
  }
}

module.exports = OutputCapture;
