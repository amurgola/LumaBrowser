const crypto = require('crypto');

class VaultLock {
  static KEY = 'core.vault.master';
  static IDLE_KEY = 'core.vault.autoLockMinutes';
  static DEFAULT_IDLE_MIN = 15;
  static IDLE_CHOICES = [5, 15, 60, 240];
  static SCRYPT = { N: 32768, r: 8, p: 1, keylen: 32 };
  static MIN_LENGTH = 8;
  static MAX_FAILS = 5;
  static FAIL_DELAY_MS = 30 * 1000;

  constructor(db, { now = () => Date.now() } = {}) {
    this._db = db;
    this._now = now;
    this._unlocked = false;
    this._usedAt = 0;
    this._fails = 0;
    this._blockedUntil = 0;
  }

  isSet() {
    const rec = this._record();
    return !!(rec && rec.hash && rec.salt);
  }

  isUnlocked() {
    if (!this.isSet()) return true;
    if (!this._unlocked) return false;
    if (this._now() - this._usedAt > this.idleMinutes() * 60 * 1000) {
      this.lock();
      return false;
    }
    return true;
  }

  touch() {
    if (this._unlocked) this._usedAt = this._now();
  }

  lock() {
    this._unlocked = false;
    this._usedAt = 0;
  }

  state() {
    return { set: this.isSet(), unlocked: this.isUnlocked(), idleMinutes: this.idleMinutes() };
  }

  idleMinutes() {
    const v = Number(this._db.get(VaultLock.IDLE_KEY, VaultLock.DEFAULT_IDLE_MIN));
    return VaultLock.IDLE_CHOICES.includes(v) ? v : VaultLock.DEFAULT_IDLE_MIN;
  }

  setIdleMinutes(minutes) {
    const v = VaultLock.IDLE_CHOICES.includes(Number(minutes)) ? Number(minutes) : VaultLock.DEFAULT_IDLE_MIN;
    this._db.set(VaultLock.IDLE_KEY, v);
    return v;
  }

  unlock(password) {
    if (!this.isSet()) return { success: true };
    const wait = this._blockedUntil - this._now();
    if (wait > 0) return { success: false, error: `Too many wrong tries. Try again in ${Math.ceil(wait / 1000)} s.` };
    if (!this._matches(password)) {
      this._fails += 1;
      if (this._fails >= VaultLock.MAX_FAILS) { this._blockedUntil = this._now() + VaultLock.FAIL_DELAY_MS; this._fails = 0; }
      return { success: false, error: 'Wrong master password' };
    }
    this._fails = 0;
    this._unlocked = true;
    this._usedAt = this._now();
    return { success: true };
  }

  setPassword(current, next) {
    if (String(next || '').length < VaultLock.MIN_LENGTH) return { success: false, error: `Use at least ${VaultLock.MIN_LENGTH} characters` };
    if (this.isSet() && !this._matches(current)) return { success: false, error: 'The current master password is wrong' };
    const salt = crypto.randomBytes(16);
    this._db.set(VaultLock.KEY, { salt: salt.toString('base64'), hash: VaultLock._hash(next, salt).toString('base64'), v: 1 });
    this._unlocked = true;
    this._usedAt = this._now();
    return { success: true };
  }

  remove(current) {
    if (!this.isSet()) return { success: true };
    if (!this._matches(current)) return { success: false, error: 'Wrong master password' };
    this._db.set(VaultLock.KEY, null);
    this.lock();
    return { success: true };
  }

  _matches(password) {
    const rec = this._record();
    if (!rec || typeof password !== 'string' || !password) return false;
    const want = Buffer.from(rec.hash, 'base64');
    const got = VaultLock._hash(password, Buffer.from(rec.salt, 'base64'));
    return want.length === got.length && crypto.timingSafeEqual(want, got);
  }

  _record() {
    const rec = this._db.get(VaultLock.KEY, null);
    return rec && typeof rec === 'object' ? rec : null;
  }

  static _hash(password, salt) {
    const { N, r, p, keylen } = VaultLock.SCRYPT;
    return crypto.scryptSync(String(password), salt, keylen, { N, r, p, maxmem: 64 * 1024 * 1024 });
  }
}

module.exports = VaultLock;
