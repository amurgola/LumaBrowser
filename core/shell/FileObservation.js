const path = require('path');
const { createHash } = require('crypto');

class FileObservation {
  constructor() {
    this._seen = new Map();
  }

  static stampOf(stat) {
    if (!stat) return null;
    const fields = [stat.dev, stat.ino, stat.size, stat.mtimeMs, stat.ctimeMs].map(FileObservation._finiteOrZero);
    return `s:${fields.join(':')}`;
  }

  static stampOfText(text) {
    if (typeof text !== 'string') return null;
    return `c:${createHash('sha1').update(text, 'utf8').digest('hex')}`;
  }

  static key(absPath) {
    const resolved = path.resolve(String(absPath || ''));
    return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
  }

  observe(absPath, stamp) {
    if (!stamp) return;
    this._seen.set(FileObservation.key(absPath), stamp);
  }

  get(absPath) {
    return this._seen.get(FileObservation.key(absPath));
  }

  forget(absPath) {
    this._seen.delete(FileObservation.key(absPath));
  }

  forgetUnder(absDir) {
    const prefix = FileObservation.key(absDir) + path.sep;
    for (const key of [...this._seen.keys()]) {
      if (key.startsWith(prefix)) this._seen.delete(key);
    }
  }

  clear() {
    this._seen.clear();
  }

  get size() {
    return this._seen.size;
  }

  static _finiteOrZero(value) {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }
}

module.exports = FileObservation;
