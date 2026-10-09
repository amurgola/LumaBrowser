const crypto = require('crypto');

class PinPairing {
  static MAX_FAILS = 5;
  static LOCK_BASE_MS = 30 * 1000;

  constructor({ settings, tokens, getInstanceName, notify, now = () => Date.now() }) {
    this._settings = settings;
    this._tokens = tokens;
    this._getInstanceName = getInstanceName;
    this._notify = notify;
    this._now = now;
    this._guards = new Map();
  }

  pair(pin, { ip, peerHint } = {}) {
    const key = ip || 'unknown';
    const lockedFor = this._lockedFor(key);
    if (lockedFor > 0) return { success: false, error: 'Too many attempts. Try again later.', retryAfterMs: lockedFor };
    const stored = this._settings.getPin();
    if (!stored) return { success: false, error: 'Host has no PIN set.' };
    if (!PinPairing.pinMatches(String(pin || ''), String(stored))) return this._recordFailure(key);
    return this._issue(key, peerHint);
  }

  reset() {
    this._guards.clear();
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
    if (result.success) return { status: 200, body: { token: result.token, name: result.name } };
    return { status: result.retryAfterMs ? 429 : 401, body: { error: result.error, retryAfterMs: result.retryAfterMs } };
  }

  _lockedFor(key) {
    const guard = this._guards.get(key);
    return guard ? Math.max(0, guard.lockedUntil - this._now()) : 0;
  }

  _recordFailure(key) {
    const guard = this._guards.get(key) || { fails: 0, lockedUntil: 0 };
    guard.fails += 1;
    if (guard.fails >= PinPairing.MAX_FAILS) {
      guard.lockedUntil = this._now() + PinPairing.LOCK_BASE_MS * (guard.fails - PinPairing.MAX_FAILS + 1);
    }
    this._guards.set(key, guard);
    return { success: false, error: 'Incorrect PIN.' };
  }

  _issue(key, peerHint) {
    this._guards.delete(key);
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
