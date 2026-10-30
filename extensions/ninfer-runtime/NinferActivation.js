const NinferCatalog = require('./NinferCatalog');
const NinferModelEntries = require('./NinferModelEntries');

class NinferActivation {
  static UNAVAILABLE_WARNING = 'context.llmCatalog is unavailable; this LumaBrowser build predates LLM runtime extensions.';

  static async activate(context, platform = process.platform, arch = process.arch) {
    const api = context && context.llmCatalog;
    if (!api || typeof api.registerRuntime !== 'function') {
      if (context && context.logger) context.logger.warn(NinferActivation.UNAVAILABLE_WARNING);
      return {};
    }
    const hostKeys = [platform, `${platform}-${arch}`];
    if (!NinferCatalog.RUNTIME_ENTRY.platforms.some((key) => hostKeys.includes(key))) return {};
    NinferActivation._registerRuntime(api);
    NinferActivation._registerModels(api);
    NinferActivation._logRegistered(context);
    return {};
  }

  static _registerRuntime(api) {
    const NinferRuntimeHooks = require('./NinferRuntimeHooks');
    api.registerRuntime(NinferCatalog.RUNTIME_ENTRY, NinferRuntimeHooks.hooks());
  }

  static _registerModels(api) {
    for (const m of NinferModelEntries.ENTRIES) api.registerModel(m);
  }

  static _logRegistered(context) {
    if (!context.logger) return;
    context.logger.info(`registered runtime ${NinferCatalog.RUNTIME_ID} and ${NinferModelEntries.ENTRIES.length} add-on models`);
  }
}

module.exports = NinferActivation;
