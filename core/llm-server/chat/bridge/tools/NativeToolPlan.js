const TokenEstimator = require('../../../../shared/text/TokenEstimator');
const HarmonyModel = require('../../HarmonyModel');
const ToolSchemas = require('../../ToolSchemas');

class NativeToolPlan {
  static forRun({ router, modelRef, override = null }) {
    const enabled = NativeToolPlan._enabled(router, modelRef, override);
    const exclude = (enabled && router && typeof router.modelNativeToolExclude === 'function')
      ? router.modelNativeToolExclude(modelRef)
      : [];
    return new NativeToolPlan(enabled, exclude || []);
  }

  constructor(enabled, exclude) {
    this.enabled = enabled;
    this.exclude = exclude;
  }

  build(toolSet) {
    if (!this.enabled) return null;
    const schemas = ToolSchemas.buildHarmonyTools({
      allows: toolSet.allows,
      extTools: toolSet.allExtTools,
      activeGroups: toolSet.groups.active,
      groups: toolSet.groups.available,
    });
    if (!this.exclude.length) return schemas;
    const drop = new Set(this.exclude);
    return schemas.filter((s) => !drop.has(s && s.function && s.function.name));
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
