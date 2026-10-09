class GameControlArgs {
  static MAX_HOLD_MS = 10000;
  static MAX_DELTA = 10000;
  static MAX_SEQUENCE = 50;

  static keySequence(keys) {
    if (Array.isArray(keys)) return keys;
    return String(keys ?? '').trim().split(/\s+/).filter(Boolean);
  }

  static press(args) {
    return {
      mode: args.mode === 'vk' ? 'vk' : 'scan',
      holdMs: GameControlArgs.clamp(Number(args.holdMs) || 60, 10, GameControlArgs.MAX_HOLD_MS),
      gapMs: GameControlArgs.clamp(args.gapMs == null ? 80 : Number(args.gapMs) || 0, 0, 5000),
    };
  }

  static holdMs(args) {
    return GameControlArgs.clamp(Number(args.ms) || 500, 10, GameControlArgs.MAX_HOLD_MS);
  }

  static move(args) {
    const max = GameControlArgs.MAX_DELTA;
    return {
      dx: GameControlArgs.clamp(Math.round(Number(args.dx) || 0), -max, max),
      dy: GameControlArgs.clamp(Math.round(Number(args.dy) || 0), -max, max),
      durationMs: GameControlArgs.clamp(Number(args.durationMs) || 200, 0, 5000),
    };
  }

  static waitForChange(args) {
    return {
      timeoutMs: GameControlArgs.clamp(Number(args.timeoutMs) || 3000, 0, 60000),
      minDistance: Math.max(1, Number(args.minDistance) || 8),
      intervalMs: GameControlArgs.clamp(Number(args.intervalMs) || 100, 20, 2000),
    };
  }

  static waitForStill(args) {
    const stableMs = GameControlArgs.clamp(Number(args.stableMs) || 500, 50, 30000);
    return {
      stableMs,
      timeoutMs: GameControlArgs.clamp(Number(args.timeoutMs) || 5000, stableMs, 120000),
      maxDistance: Math.max(0, args.maxDistance == null ? 3 : Number(args.maxDistance)),
      intervalMs: GameControlArgs.clamp(Number(args.intervalMs) || 100, 20, 2000),
    };
  }

  static calibrate(args) {
    return {
      dx: Number(args.dx) || 200,
      settleMs: GameControlArgs.clamp(Number(args.settleMs) || 300, 50, 3000),
    };
  }

  static clamp(value, lo, hi) {
    return Math.max(lo, Math.min(hi, value));
  }
}

module.exports = GameControlArgs;
