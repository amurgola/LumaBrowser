const TriggerFailurePolicy = require('./TriggerFailurePolicy');

class FailureStreak {
  static REASON_ERROR_CHARS = 200;

  static after(trigger, { status, error } = {}) {
    const failed = status === 'error';
    const streak = failed ? (trigger.consecutiveFailures || 0) + 1 : 0;
    const autoPaused = FailureStreak._pauses(trigger, failed, streak);
    return {
      failed,
      consecutiveFailures: streak,
      firstFailure: failed && streak === 1,
      autoPaused,
      pausedReason: autoPaused ? FailureStreak._reason(streak, error) : null,
    };
  }

  static _pauses(trigger, failed, streak) {
    const limit = TriggerFailurePolicy.of(trigger).autoPauseAfter;
    return !!(failed && trigger.enabled && limit > 0 && streak >= limit);
  }

  static _reason(streak, error) {
    const last = String(error || 'unknown error').slice(0, FailureStreak.REASON_ERROR_CHARS);
    return `paused automatically after ${streak} consecutive failed run${streak === 1 ? '' : 's'}; last: ${last}`;
  }
}

module.exports = FailureStreak;
