const crypto = require('crypto');
const PairingThrottle = require('./PairingThrottle');

class PinPairing {
  constructor({ settings, tokens, getInstanceName, notify, now = () => Date.now() }) {
    this._settings = settings;
    this._tokens = tokens;
    this._getInstanceName = getInstanceName;
    this._notify = notify;
    this._throttle = new PairingThrottle({ now });
  }

  pair(pin, { ip, peerHint } = {}) {
    const key = ip || 'unknown';
    const lockedFor = this._throttle.lockedFor(key);
    if (lockedFor > 0) return { success: false, error: 'Too many attempts. Try again later.', retryAfterMs: lockedFor };
    const stored = this._settings.getPin();
    if (!stored) return { success: false, error: 'Host has no PIN set.' };
    if (!PinPairing.pinMatches(String(pin || ''), String(stored))) return this._recordFailure(key);
    return this._issue(key, peerHint);
  }

  reset() {
    this._throttle.reset();
  }

  static pinMatches(given, stored) {
    const a = Buffer.from(given);
    const b = Buffer.from(stored);
    if (a.length !== b.length) {
      crypto.timingSafeEqual(a, a);
      return false;
    }
    return crypto.timingSafeEqual(a, b);
  }

  static toReply(result) {
    if (result.success) return { status: 200, body: { token: result.token, name: result.name, user: result.user || null } };
    return { status: result.retryAfterMs ? 429 : 401, body: { error: result.error, retryAfterMs: result.retryAfterMs } };
  }

  _recordFailure(key) {
    this._throttle.recordFailure(key);
    return { success: false, error: 'Incorrect PIN.' };
  }

  _issue(key, peerHint) {
    this._throttle.recordSuccess(key);
    const entry = this._tokens.issue({ label: peerHint || `Peer ${key}`, peerHint: peerHint || key });
    this._notifyNewClient({ ip: key, peerHint: peerHint || null, label: entry.label, tokenId: entry.id });
    return { success: true, token: entry.token, name: this._getInstanceName() };
  }

  _notifyNewClient(info) {
    try {
      this._notify(info);
    } catch (_) {}
  }
}

module.exports = PinPairing;
