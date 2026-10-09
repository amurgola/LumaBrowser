const TriggerSourceConfig = require('./TriggerSourceConfig');
const TriggerActionConfig = require('./TriggerActionConfig');
const TriggerLifecycle = require('./TriggerLifecycle');

class TriggerPatch {
  static ARM_REFUSAL = 'trigger cannot be armed until a test of its current configuration passes';

  static apply(current, patch = {}) {
    const next = TriggerPatch._merged(current, patch);
    const enabled = TriggerPatch._enabled(current, next, patch);
    return { next, enabled, rearmed: enabled && !current.enabled };
  }

  static _merged(current, patch) {
    const next = { ...current };
    if (patch.title != null) next.title = String(patch.title).trim() || current.title;
    if (patch.source && typeof patch.source === 'object') {
      next.source = TriggerSourceConfig.normalize(current.kind, TriggerSourceConfig.merge(current.source, patch.source));
    }
    if (patch.action && typeof patch.action === 'object') {
      next.action = TriggerActionConfig.normalize(TriggerActionConfig.merge(current.action, patch.action));
    }
    return next;
  }

  static _enabled(current, next, patch) {
    if (patch.enabled === undefined) {
      return TriggerLifecycle.configHash(next) === TriggerLifecycle.configHash(current) ? current.enabled : false;
    }
    if (!patch.enabled) return false;
    if (!TriggerLifecycle.isArmable(next)) throw new Error(TriggerPatch.ARM_REFUSAL);
    return true;
  }
}

module.exports = TriggerPatch;
