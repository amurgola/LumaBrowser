const crypto = require('crypto');

class InboundToken {
  static KEY = 'inboundToken';
  static PREFIX = 'hub_';
  static BYTES = 24;

  constructor(db, { random = () => crypto.randomBytes(InboundToken.BYTES).toString('hex') } = {}) {
    this._db = db;
    this._random = random;
  }

  get() {
    const stored = this._db.get(InboundToken.KEY, '');
    if (typeof stored === 'string' && stored) return stored;
    return this.rotate();
  }

  rotate() {
    const token = InboundToken.PREFIX + this._random();
    this._db.set(InboundToken.KEY, token);
    return token;
  }

  matches(headers) {
    const presented = InboundToken._presented(headers || {});
    if (!presented) return false;
    const expected = Buffer.from(this.get());
    const given = Buffer.from(presented);
    return expected.length === given.length && crypto.timingSafeEqual(expected, given);
  }

  static _presented(headers) {
    const explicit = headers['x-hub-token'];
    if (typeof explicit === 'string' && explicit.trim()) return explicit.trim();
    const auth = headers['authorization'];
    const match = typeof auth === 'string' ? /^Bearer\s+(.+)$/i.exec(auth.trim()) : null;
    return match ? match[1].trim() : null;
  }
}

module.exports = InboundToken;
