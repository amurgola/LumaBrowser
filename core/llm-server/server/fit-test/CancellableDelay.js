class CancellableDelay {
  static STEP_MS = 200;

  static sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static until(ms, shouldCancel) {
    return new Promise((resolve) => {
      let waited = 0;
      const tick = () => {
        if (waited >= ms || CancellableDelay._isCancelled(shouldCancel)) return resolve();
        waited += CancellableDelay.STEP_MS;
        setTimeout(tick, Math.min(CancellableDelay.STEP_MS, ms - waited + CancellableDelay.STEP_MS));
        return undefined;
      };
      setTimeout(tick, Math.min(CancellableDelay.STEP_MS, ms));
    });
  }

  static _isCancelled(shouldCancel) {
    try { return !!(shouldCancel && shouldCancel()); } catch (_) { return false; }
  }
}

module.exports = CancellableDelay;
