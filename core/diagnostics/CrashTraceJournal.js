const fs = require('fs');

class CrashTraceJournal {
  constructor(file, fd, start) {
    this.file = file;
    this._fd = fd;
    this._start = start;
    this.closed = false;
  }

  static open(file, start) {
    try {
      return new CrashTraceJournal(file, fs.openSync(file, 'a'), start);
    } catch (_) {
      return null;
    }
  }

  write(line) {
    if (this.closed) return;
    try { fs.writeSync(this._fd, `${this._elapsed()} ${line}\n`); } catch (_) {}
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    try { fs.closeSync(this._fd); } catch (_) {}
  }

  _elapsed() {
    return `+${String(Date.now() - this._start).padStart(7)}ms`;
  }
}

module.exports = CrashTraceJournal;
