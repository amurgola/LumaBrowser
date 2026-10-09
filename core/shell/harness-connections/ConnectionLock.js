const fs = require('fs');
const path = require('path');

class ConnectionLock {
  static STALE_MS = 30 * 1000;
  static WAIT_MS = 5 * 1000;
  static RETRY_MS = 50;
  static BUSY = 'Another LumaBrowser window is changing agent connections. Try again in a moment.';

  constructor(file) {
    this._file = file;
  }

  hold(work) {
    this._acquire();
    try {
      return work();
    } finally {
      this._release();
    }
  }

  _acquire() {
    fs.mkdirSync(path.dirname(this._file), { recursive: true });
    const started = Date.now();
    while (!this._tryCreate()) {
      const age = this._age();
      if (age !== null && age > ConnectionLock.STALE_MS) this._release();
      else if (Date.now() - started > ConnectionLock.WAIT_MS) throw new Error(ConnectionLock.BUSY);
      else if (age !== null) ConnectionLock._pause();
    }
  }

  _tryCreate() {
    try {
      fs.writeFileSync(this._file, String(process.pid), { flag: 'wx' });
      return true;
    } catch (err) {
      if (!err || err.code !== 'EEXIST') throw err;
      return false;
    }
  }

  _age() {
    try {
      return Date.now() - fs.statSync(this._file).mtimeMs;
    } catch (_) {
      return null;
    }
  }

  _release() {
    try { fs.unlinkSync(this._file); } catch (_) {}
  }

  static _pause() {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ConnectionLock.RETRY_MS);
  }
}

module.exports = ConnectionLock;
