const LaunchPlanner = require('../server/LaunchPlanner');

class EffectiveContext {
  static LIVE_STATES = Object.freeze(['ready', 'starting']);

  static resolve({ status, defaults }) {
    const plan = EffectiveContext._livePlan(status);
    if (plan) return EffectiveContext._fromPlan(plan);
    return EffectiveContext._fromDefaults(defaults || {});
  }

  static clampSlots(n) {
    const v = Math.floor(Number(n));
    return Number.isFinite(v) && v >= 1 ? v : 1;
  }

  static _livePlan(status) {
    if (!status || !EffectiveContext.LIVE_STATES.includes(status.state) || !status.plan) return null;
    const ctx = Number(status.plan.contextSize);
    return Number.isFinite(ctx) && ctx > 0 ? status.plan : null;
  }

  static _fromPlan(plan) {
    const contextWindow = Math.floor(Number(plan.contextSize));
    const slots = EffectiveContext.clampSlots(plan.maxConcurrent);
    const perSlot = Number(plan.ctxPerSlot);
    return {
      contextWindow,
      ctxPerSlot: Number.isFinite(perSlot) && perSlot > 0
        ? Math.floor(perSlot)
        : Math.max(1, Math.floor(contextWindow / slots)),
      slots,
      source: 'plan',
    };
  }

  static _fromDefaults(defaults) {
    const raw = Number(defaults.contextSize);
    const contextWindow = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : LaunchPlanner.DEFAULT_CONTEXT;
    const slots = EffectiveContext.clampSlots(defaults.maxConcurrent);
    return {
      contextWindow,
      ctxPerSlot: Math.max(1, Math.floor(contextWindow / slots)),
      slots,
      source: 'defaults',
    };
  }
}

module.exports = EffectiveContext;
