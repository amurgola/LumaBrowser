const crypto = require('crypto');

class DesktopToken {
  static KEY = 'token';
  static PREFIX = 'dsk_';
  static BYTES = 24;
  static HEADER = 'x-luma-desktop-token';

  constructor(db, { random = () => crypto.randomBytes(DesktopToken.BYTES).toString('hex') } = {}) {
    this._db = db;
    this._random = random;
  }

  get() {
    const stored = this._db.get(DesktopToken.KEY, '');
    if (typeof stored === 'string' && stored.startsWith(DesktopToken.PREFIX)) return stored;
    return this.rotate();
  }

  rotate() {
    const token = DesktopToken.PREFIX + this._random();
    this._db.set(DesktopToken.KEY, token);
    return token;
  }

  matches(headers) {
    const presented = DesktopToken.presented(headers || {});
    if (!presented) return false;
    const expected = Buffer.from(this.get());
    const given = Buffer.from(presented);
    return expected.length === given.length && crypto.timingSafeEqual(expected, given);
  }

  static presented(headers) {
    const explicit = headers[DesktopToken.HEADER];
    if (typeof explicit === 'string' && explicit.trim()) return explicit.trim();
    const auth = headers['authorization'];
    const match = typeof auth === 'string' ? /^Bearer\s+(.+)$/i.exec(auth.trim()) : null;
    return match ? match[1].trim() : null;
  }
}

module.exports = DesktopToken;
