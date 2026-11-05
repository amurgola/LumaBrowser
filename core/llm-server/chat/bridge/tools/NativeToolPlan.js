const TokenEstimator = require('../../../../shared/text/TokenEstimator');
const HarmonyModel = require('../../HarmonyModel');
const ToolSchemas = require('../../ToolSchemas');
const LazySchemaStubber = require('../../tool-schemas/LazySchemaStubber');

class NativeToolPlan {
  static MAX_CONTEXT_SHARE = 0.25;

  static forRun({ router, modelRef, override = null, ctxPerSlot = null }) {
    const enabled = NativeToolPlan._enabled(router, modelRef, override);
    const exclude = (enabled && router && typeof router.modelNativeToolExclude === 'function')
      ? router.modelNativeToolExclude(modelRef)
      : [];
    return new NativeToolPlan(enabled, exclude, ctxPerSlot);
  }

  constructor(enabled, exclude, ctxPerSlot = null) {
    this.enabled = enabled;
    this.exclude = exclude;
    this.ctxPerSlot = Number(ctxPerSlot) > 0 ? Number(ctxPerSlot) : null;
  }

  build(toolSet) {
    if (!this.enabled) return null;
    const full = this._schemas(toolSet, false);
    return this._overBudget(full) ? this._schemas(toolSet, true) : full;
  }

  trimsInactive(toolSet) {
    return this.enabled && this._overBudget(this._schemas(toolSet, false));
  }

  _schemas(toolSet, dropInactive) {
    let schemas = ToolSchemas.buildHarmonyTools({
      allows: toolSet.allows,
      extTools: toolSet.allExtTools,
      activeGroups: toolSet.groups.active,
      groups: toolSet.groups.available,
    });
    if (dropInactive) schemas = LazySchemaStubber.dropInactive(schemas, toolSet.groups.available, toolSet.groups.active);
    if (!this.exclude.length) return schemas;
    const drop = new Set(this.exclude);
    return schemas.filter((s) => !drop.has(s && s.function && s.function.name));
  }

  _overBudget(schemas) {
    if (!this.ctxPerSlot) return false;
    return TokenEstimator.estimateTokens(JSON.stringify(schemas)) > this.ctxPerSlot * NativeToolPlan.MAX_CONTEXT_SHARE;
  }

  estimateTokens(toolSet) {
    if (!this.enabled) return 0;
    try {
      const schemas = this.build(toolSet);
      return schemas ? TokenEstimator.estimateTokens(JSON.stringify(schemas)) : 0;
    } catch (_) {
      return 0;
    }
  }

  static _enabled(router, modelRef, override) {
    if (override === 'off' && !HarmonyModel.matches(modelRef)) return false;
    if (router && typeof router.modelNativeToolsActive === 'function') return router.modelNativeToolsActive(modelRef);
    return HarmonyModel.matches(modelRef);
  }
}

module.exports = NativeToolPlan;
