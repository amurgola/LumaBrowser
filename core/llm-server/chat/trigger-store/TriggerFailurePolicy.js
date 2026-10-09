const TriggerPolicy = require('./TriggerPolicy');

class TriggerFailurePolicy extends TriggerPolicy {
  static DEFAULT_AUTO_PAUSE_AFTER = 3;
  static MAX_AUTO_PAUSE_AFTER = 100;
  static DEFAULT_RETRY_MAX = 1;
  static MAX_RETRY_MAX = 5;
  static DEFAULT_RETRY_BACKOFF_MS = 30 * 1000;
  static MIN_RETRY_BACKOFF_MS = 5 * 1000;
  static MAX_RETRY_BACKOFF_MS = 60 * 60 * 1000;

  static normalizeInto(source, out) {
    const P = TriggerFailurePolicy;
    P._storeNumber(out, 'autoPauseAfter', source.autoPauseAfter, P.DEFAULT_AUTO_PAUSE_AFTER, 0, P.MAX_AUTO_PAUSE_AFTER);
    if (source.notifyFailures === false) out.notifyFailures = false;
    P._storeNumber(out, 'retryMax', source.retryMax, P.DEFAULT_RETRY_MAX, 0, P.MAX_RETRY_MAX);
    P._storeNumber(out, 'retryBackoffMs', source.retryBackoffMs, P.DEFAULT_RETRY_BACKOFF_MS, P.MIN_RETRY_BACKOFF_MS, P.MAX_RETRY_BACKOFF_MS);
    return out;
  }

  static of(trigger) {
    const s = TriggerPolicy.sourceOf(trigger);
    const P = TriggerFailurePolicy;
    return {
      autoPauseAfter: s.autoPauseAfter !== undefined ? s.autoPauseAfter : P.DEFAULT_AUTO_PAUSE_AFTER,
      notifyFailures: s.notifyFailures !== false,
      retryMax: s.retryMax !== undefined ? s.retryMax : P.DEFAULT_RETRY_MAX,
      retryBackoffMs: s.retryBackoffMs !== undefined ? s.retryBackoffMs : P.DEFAULT_RETRY_BACKOFF_MS,
    };
  }

  static _storeNumber(out, key, raw, fallback, min, max) {
    if (raw === undefined || raw === null) return;
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n !== fallback) out[key] = TriggerPolicy.clampedInt(n, min, max);
  }
}

module.exports = TriggerFailurePolicy;
