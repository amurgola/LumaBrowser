class RelativeMovePlan {
  static TICK_MS = 10;

  static tickCount(durationMs) {
    return Math.max(1, Math.round(durationMs / RelativeMovePlan.TICK_MS));
  }

  static chunks(dx, dy, ticks) {
    const out = [];
    let px = 0;
    let py = 0;
    for (let i = 1; i <= ticks; i++) {
      const tx = Math.round((dx * i) / ticks);
      const ty = Math.round((dy * i) / ticks);
      out.push({ dx: tx - px, dy: ty - py });
      px = tx;
      py = ty;
    }
    return out;
  }
}

module.exports = RelativeMovePlan;
