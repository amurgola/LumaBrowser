const TokenEstimator = require('../../../../shared/text/TokenEstimator');
const HarmonyModel = require('../../HarmonyModel');
const ToolSchemas = require('../../ToolSchemas');
const LazySchemaStubber = require('../../tool-schemas/LazySchemaStubber');

class NativeToolPlan {
  static forRun({ router, modelRef, override = null }) {
    const enabled = NativeToolPlan._enabled(router, modelRef, override);
    const exclude = (enabled && router && typeof router.modelNativeToolExclude === 'function')
      ? router.modelNativeToolExclude(modelRef)
      : [];
    return new NativeToolPlan(enabled, exclude);
  }

  constructor(enabled, exclude) {
    this.enabled = enabled;
    this.exclude = exclude;
  }

  build(toolSet) {
    if (!this.enabled) return null;
    const groups = toolSet.groups;
    const all = ToolSchemas.buildHarmonyTools({ allows: toolSet.allows, extTools: toolSet.allExtTools });
    const registered = LazySchemaStubber.dropInactive(all, groups.available, groups.registeredKeys());
    return this._withoutExcluded(NativeToolPlan._withDispatcher(registered, groups.available));
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

  static _withDispatcher(schemas, availableGroups) {
    if (!Array.isArray(availableGroups) || availableGroups.length === 0) return schemas;
    return [...schemas, ToolSchemas.callToolSchema()];
  }

  _withoutExcluded(schemas) {
    if (!this.exclude.length) return schemas;
    const drop = new Set(this.exclude);
    return schemas.filter((s) => !drop.has(s && s.function && s.function.name));
  }

  static _enabled(router, modelRef, override) {
    if (override === 'off' && !HarmonyModel.matches(modelRef)) return false;
    if (router && typeof router.modelNativeToolsActive === 'function') return router.modelNativeToolsActive(modelRef);
    return HarmonyModel.matches(modelRef);
  }
}

module.exports = NativeToolPlan;
