const KvCacheModes = require('../../../shared/llm/KvCacheModes');
const LaunchPlanner = require('../LaunchPlanner');
const ContextEstimator = require('../../ContextEstimator');
const LlmLayoutIntent = require('./LlmLayoutIntent');

class LaunchOverrides {
  static apply(ctx, { freeMemory }) {
    ctx.kvMode = ctx.defaults.kvCacheType;
    ctx.userArgs = LaunchOverrides._userArgs(ctx);
    ctx.overrides = LaunchOverrides._fromDefaults(ctx, freeMemory);
    LaunchOverrides._pinTensorSplitKv(ctx.overrides);
    ctx.layout = LlmLayoutIntent.read(ctx.settingsDb);
    LaunchOverrides._applyLayout(ctx.overrides, ctx.layout);
    LaunchOverrides._applyMeasuredFit(ctx);
  }

  static _userArgs(ctx) {
    const service = ctx.service;
    return typeof service.resolveModelLaunchFlags === 'function'
      ? service.resolveModelLaunchFlags(ctx.defaults.modelPath) : '';
  }

  static _fromDefaults(ctx, freeMemory) {
    const defaults = ctx.defaults;
    const kvPair = KvCacheModes.pair(ctx.kvMode);
    return {
      contextSize: defaults.contextSize,
      cacheTypeK: kvPair.k,
      cacheTypeV: kvPair.v,
      maxConcurrent: defaults.maxConcurrent,
      tensorSplitMode: !!defaults.tensorSplit,
      cacheReuse: !!defaults.cacheReuse,
      promptCacheRam: LaunchOverrides._promptCacheRam(ctx.settingsDb),
      cpuMoe: !!defaults.cpuMoe,
      noSpecDrafter: !!defaults.noSpecDrafter,
      noNgramSpec: !!defaults.noNgramSpec,
      suppressMmprojLoad: !ctx.withVision,
      ramPin: LaunchOverrides._ramPin(ctx, freeMemory),
    };
  }

  static _promptCacheRam(settingsDb) {
    return settingsDb && typeof settingsDb.get === 'function'
      ? settingsDb.get(LaunchPlanner.PROMPT_CACHE_RAM_SETTING_KEY, 'auto') : 'auto';
  }

  static _ramPin(ctx, freeMemory) {
    const ramPin = ctx.service.ramPin;
    const active = !!(ramPin && ramPin.isActiveFor(ctx.defaults.modelPath));
    return active ? { freeBytes: freeMemory() } : null;
  }

  static _pinTensorSplitKv(overrides) {
    if (!overrides.tensorSplitMode) return;
    overrides.cacheTypeK = 'f16';
    overrides.cacheTypeV = 'f16';
  }

  static _applyLayout(overrides, layout) {
    if (layout.noKvOffload) overrides.noKvOffload = true;
    if (layout.vramCapBytes != null) overrides.vramCapBytes = layout.vramCapBytes;
  }

  static _applyMeasuredFit(ctx) {
    try {
      const service = ctx.service;
      const fitEntry = service.getFitResults ? service.getFitResults(ctx.defaults.modelPath) : null;
      const measured = ContextEstimator.measuredComboVram(fitEntry, ctx.overrides.contextSize, ctx.kvMode);
      if (measured == null) return;
      const mmprojBytes = ctx.withVision ? (Number(ctx.model && ctx.model.mmprojTotalBytes) || 0) : 0;
      ctx.overrides.measuredVramBytes = measured + mmprojBytes;
    } catch (_) {}
  }
}

module.exports = LaunchOverrides;
