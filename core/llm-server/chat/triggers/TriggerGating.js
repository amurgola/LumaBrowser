const TriggerFilter = require('./TriggerFilter');

class TriggerGating {
  static MIN_COOLDOWN_MS = 1000;
  static MAX_COOLDOWN_MS = 24 * 60 * 60 * 1000;
  static MIN_BATCH_WINDOW_MS = 2000;
  static MAX_BATCH_WINDOW_MS = 60 * 60 * 1000;
  static MAX_BATCH_SIZE = 200;
  static DEFAULT_BATCH_MAX = 25;

  static normalizeCooldownMs(value) {
    const ms = parseInt(value, 10);
    if (!Number.isFinite(ms) || ms <= 0) return 0;
    return TriggerGating._clamp(ms, TriggerGating.MIN_COOLDOWN_MS, TriggerGating.MAX_COOLDOWN_MS);
  }

  static normalizeBatch(batch) {
    if (!batch || typeof batch !== 'object') return null;
    const windowMs = parseInt(batch.windowMs, 10);
    if (!Number.isFinite(windowMs) || windowMs <= 0) return null;
    return {
      windowMs: TriggerGating._clamp(windowMs, TriggerGating.MIN_BATCH_WINDOW_MS, TriggerGating.MAX_BATCH_WINDOW_MS),
      max: TriggerGating._batchMax(batch.max),
    };
  }

  static normalize(source = {}) {
    const out = {};
    const filter = TriggerFilter.normalize(source.filter);
    if (filter) out.filter = filter;
    const cooldownMs = TriggerGating.normalizeCooldownMs(source.cooldownMs);
    if (cooldownMs) out.cooldownMs = cooldownMs;
    const batch = TriggerGating.normalizeBatch(source.batch);
    if (batch) out.batch = batch;
    return out;
  }

  static buildBatchEvent(events, { windowMs, reason } = {}) {
    const list = Array.isArray(events) ? events : [];
    return {
      receivedAt: new Date().toISOString(),
      event: 'batch',
      count: list.length,
      windowMs: windowMs || null,
      reason: reason || 'window',
      firstAt: TriggerGating._receivedAt(list[0]),
      lastAt: TriggerGating._receivedAt(list[list.length - 1]),
      events: list,
    };
  }

  static describe(gating = {}) {
    const parts = [];
    if (gating.filter) parts.push(TriggerGating._describeFilter(gating.filter));
    if (gating.cooldownMs) parts.push(`cooldown ${Math.round(gating.cooldownMs / 1000)} s`);
    if (gating.batch) parts.push(`batch ${Math.round(gating.batch.windowMs / 1000)} s / ${gating.batch.max}`);
    return parts.join(' · ');
  }

  static _describeFilter(filter) {
    const count = Object.keys(filter).length;
    return `filter: ${count} rule${count === 1 ? '' : 's'}`;
  }

  static _batchMax(value) {
    const max = parseInt(value, 10);
    return Number.isFinite(max) && max > 0 ? Math.min(TriggerGating.MAX_BATCH_SIZE, max) : TriggerGating.DEFAULT_BATCH_MAX;
  }

  static _receivedAt(event) {
    return event ? (event.receivedAt || null) : null;
  }

  static _clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
}

module.exports = TriggerGating;
