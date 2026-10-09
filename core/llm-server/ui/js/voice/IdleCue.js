export default class IdleCue {
  static GRACE_MS = 1400;
  static EVERY_MS = 2600;

  constructor(scheduler, isWaiting) {
    this._scheduler = scheduler;
    this._isWaiting = isWaiting;
    this._timer = null;
  }

  start() {
    this.stop();
    this._loop(IdleCue.GRACE_MS);
  }

  stop() {
    if (!this._timer) return;
    clearTimeout(this._timer);
    this._timer = null;
  }

  _loop(delay) {
    this._timer = setTimeout(() => {
      if (!this._isWaiting()) { this._timer = null; return; }
      if (this._scheduler.liveCount === 0) this._blip();
      this._loop(IdleCue.EVERY_MS);
    }, delay);
  }

  _blip() {
    try {
      const ctx = this._scheduler.ensureContext();
      const t0 = ctx.currentTime + 0.02;
      const base = 470 + Math.random() * 50;
      [1, 1.335].forEach((ratio, i) => IdleCue._note(ctx, base * ratio, t0 + i * 0.17));
    } catch (_) {}
  }

  static _note(ctx, frequency, at) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.05, at + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0008, at + 0.24);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(at);
    osc.stop(at + 0.26);
  }
}
