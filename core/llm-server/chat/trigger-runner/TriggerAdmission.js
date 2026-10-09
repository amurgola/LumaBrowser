const TriggerFilter = require('../triggers/TriggerFilter');
const WebhookPresets = require('../triggers/WebhookPresets');

class TriggerAdmission {
  constructor({ now = () => Date.now() } = {}) {
    this._now = now;
    this._lastAccepted = new Map();
  }

  refusal(trigger, event) {
    const source = trigger.source || {};
    return this._loopGuardRefusal(trigger, source, event)
      || this._filterRefusal(source, event)
      || this._cooldownRefusal(trigger, source);
  }

  markAccepted(triggerId) {
    this._lastAccepted.set(triggerId, this._now());
  }

  static report(trigger, event) {
    const source = (trigger && trigger.source) || {};
    const out = {};
    if (source.filter) out.filter = TriggerFilter.evaluate(source.filter, event);
    if (source.cooldownMs) out.cooldownMs = source.cooldownMs;
    if (source.batch) out.batch = source.batch;
    return Object.keys(out).length ? out : null;
  }

  _loopGuardRefusal(trigger, source, event) {
    if (trigger.kind !== 'webhook' || source.botGuard === false) return null;
    const guard = WebhookPresets.loopGuard(source.preset, event && event.body);
    if (!guard.skip) return null;
    return {
      outcome: 'filtered',
      detail: `loop guard: ${guard.reason}`,
      reply: { accepted: false, reason: 'filtered', filtered: ['loop guard'], loopGuard: guard.reason },
    };
  }

  _filterRefusal(source, event) {
    if (!source.filter) return null;
    const result = TriggerFilter.evaluate(source.filter, event);
    if (result.pass) return null;
    return {
      outcome: 'filtered',
      detail: `filter did not match: ${result.failed.join(', ')}`,
      reply: { accepted: false, reason: 'filtered', filtered: result.failed },
    };
  }

  _cooldownRefusal(trigger, source) {
    if (!source.cooldownMs) return null;
    const since = this._now() - this._lastAcceptedAt(trigger);
    if (since >= source.cooldownMs) return null;
    const left = Math.ceil((source.cooldownMs - since) / 1000);
    return {
      outcome: 'cooldown',
      detail: `within cooldown, ${left} s left`,
      reply: { accepted: false, reason: 'cooldown', retryAfterS: left },
    };
  }

  _lastAcceptedAt(trigger) {
    const remembered = this._lastAccepted.get(trigger.id) || 0;
    const stored = trigger.lastFiredAt ? new Date(trigger.lastFiredAt).getTime() : 0;
    return Math.max(remembered, Number.isFinite(stored) ? stored : 0);
  }
}

module.exports = TriggerAdmission;
