class BootClock {
  static GLOBAL_KEY = '__LUMA_BOOT_START';

  constructor({ now = Date.now, log = console.log, globalObject = global } = {}) {
    this._now = now;
    this._log = log;
    this.start = now();
    globalObject[BootClock.GLOBAL_KEY] = this.start;
  }

  elapsed() {
    return this._now() - this.start;
  }

  log(label) {
    this._log(`[luma-boot +${this.elapsed()}ms] main: ${label}`);
  }
}

module.exports = BootClock;
