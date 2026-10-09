const fs = require('fs');

class LogTail {
  static DEFAULT_BYTES = 4 * 1024;
  static MAX_BYTES = 256 * 1024;

  static read(logPath, bytes = LogTail.DEFAULT_BYTES) {
    if (!logPath) return { text: '', totalBytes: 0, logPath: null };
    try {
      return LogTail._readTail(logPath, LogTail.clampBytes(bytes));
    } catch {
      return { text: '', totalBytes: 0, logPath };
    }
  }

  static clampBytes(bytes) {
    return Math.max(1, Math.min(Number(bytes) || LogTail.DEFAULT_BYTES, LogTail.MAX_BYTES));
  }

  static _readTail(logPath, count) {
    const totalBytes = fs.statSync(logPath).size;
    const start = Math.max(0, totalBytes - count);
    const text = LogTail._readRange(logPath, start, totalBytes - start).toString('utf8');
    return { text: start > 0 ? LogTail._dropTornLine(text) : text, totalBytes, logPath };
  }

  static _readRange(logPath, start, length) {
    const buffer = Buffer.alloc(length);
    const fd = fs.openSync(logPath, 'r');
    try {
      fs.readSync(fd, buffer, 0, length, start);
    } finally {
      fs.closeSync(fd);
    }
    return buffer;
  }

  static _dropTornLine(text) {
    const newline = text.indexOf('\n');
    return newline !== -1 && newline < text.length - 1 ? text.slice(newline + 1) : text;
  }
}

module.exports = LogTail;
