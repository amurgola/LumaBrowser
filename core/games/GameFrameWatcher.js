const FrameHash = require('./FrameHash');
const GameControlArgs = require('./GameControlArgs');

class GameFrameWatcher {
  constructor({ frameHash, sleep, now }) {
    this._frameHash = frameHash;
    this._sleep = sleep;
    this._now = now;
  }

  async waitForChange(args = {}) {
    const opts = GameControlArgs.waitForChange(args);
    const base = args.since ? { success: true, data: { hash: args.since } } : this._frameHash(args);
    if (!base.success) return base;
    return this._pollForChange(args, base.data.hash, opts);
  }

  async waitForStill(args = {}) {
    const opts = GameControlArgs.waitForStill(args);
    const t0 = this._now();
    const first = this._frameHash(args);
    if (!first.success) return first;
    return this._pollForStill(args, first.data.hash, t0, opts);
  }

  async _pollForChange(args, base, { timeoutMs, minDistance, intervalMs }) {
    const t0 = this._now();
    let last = base;
    let distance = 0;
    for (;;) {
      const r = this._frameHash(args);
      if (!r.success) return r;
      last = r.data.hash;
      distance = FrameHash.hamming(base, last);
      if (distance >= minDistance) return this._changeResult(true, distance, t0, last);
      if (this._now() - t0 >= timeoutMs) return this._changeResult(false, distance, t0, last);
      await this._sleep(intervalMs);
    }
  }

  async _pollForStill(args, firstHash, t0, { stableMs, timeoutMs, maxDistance, intervalMs }) {
    let ref = firstHash;
    let since = this._now();
    for (;;) {
      if (this._now() - since >= stableMs) return this._stillResult(true, t0, ref);
      if (this._now() - t0 >= timeoutMs) return this._stillResult(false, t0, ref);
      await this._sleep(intervalMs);
      const r = this._frameHash(args);
      if (!r.success) return r;
      if (FrameHash.hamming(ref, r.data.hash) > maxDistance) {
        ref = r.data.hash;
        since = this._now();
      }
    }
  }

  _changeResult(changed, distance, t0, hash) {
    return { success: true, data: { changed, distance, ms: this._now() - t0, hash } };
  }

  _stillResult(still, t0, hash) {
    return { success: true, data: { still, ms: this._now() - t0, hash } };
  }
}

module.exports = GameFrameWatcher;
