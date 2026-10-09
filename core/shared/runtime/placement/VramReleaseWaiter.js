const CudaDeviceProbe = require('../CudaDeviceProbe');

const GB = 1024 * 1024 * 1024;

class VramReleaseWaiter {
  static POLL_INTERVAL_MS = 400;
  static MIN_RISE_BYTES = 4 * GB;
  static FREE_FRACTION = 0.6;
  static SETTLE_MS = 350;
  static BLIND_WAIT_MS = 1500;

  constructor({ readCardFree = VramReleaseWaiter.readCardFree, sleep = VramReleaseWaiter._sleep } = {}) {
    this._readCardFree = readCardFree;
    this._sleep = sleep;
  }

  static readCardFree(cardIdx) {
    const dev = (CudaDeviceProbe.readDevices(null) || []).find((d) => d.index === cardIdx);
    return dev && dev.freeBytes != null ? { free: dev.freeBytes, total: dev.totalBytes } : null;
  }

  read(cardIdx) {
    if (cardIdx == null) return null;
    try { return this._readCardFree(cardIdx); } catch (_) { return null; }
  }

  async wait(cardIdx, baselineFree, maxWaitMs) {
    if (maxWaitMs <= 0 || cardIdx == null) return;
    if (baselineFree == null) return this._sleep(Math.min(VramReleaseWaiter.BLIND_WAIT_MS, maxWaitMs));
    let waited = 0;
    while (waited < maxWaitMs) {
      const info = this.read(cardIdx);
      if (!info || info.free == null) return this._sleep(Math.min(VramReleaseWaiter.BLIND_WAIT_MS, maxWaitMs - waited));
      if (VramReleaseWaiter._reclaimed(info, baselineFree)) return this._sleep(VramReleaseWaiter.SETTLE_MS);
      await this._sleep(VramReleaseWaiter.POLL_INTERVAL_MS);
      waited += VramReleaseWaiter.POLL_INTERVAL_MS;
    }
  }

  static _reclaimed(info, baselineFree) {
    return info.free >= baselineFree + VramReleaseWaiter.MIN_RISE_BYTES
      || Boolean(info.total && info.free >= info.total * VramReleaseWaiter.FREE_FRACTION);
  }

  static _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = VramReleaseWaiter;
