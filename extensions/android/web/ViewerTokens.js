const crypto = require('crypto');

class ViewerTokens {
  static LIFETIME_MS = 30000;

  constructor({ now = Date.now, random = () => crypto.randomBytes(24).toString('hex') } = {}) {
    this._now = now;
    this._random = random;
    this._tickets = new Map();
  }

  issue(deviceName) {
    this._dropExpired();
    const token = this._random();
    this._tickets.set(token, { deviceName, expiresAt: this._now() + ViewerTokens.LIFETIME_MS });
    return token;
  }

  redeem(token) {
    const ticket = this._tickets.get(String(token || ''));
    if (!ticket) return null;
    this._tickets.delete(String(token));
    return ticket.expiresAt >= this._now() ? ticket.deviceName : null;
  }

  _dropExpired() {
    for (const [token, ticket] of this._tickets) {
      if (ticket.expiresAt < this._now()) this._tickets.delete(token);
    }
  }
}

module.exports = ViewerTokens;
