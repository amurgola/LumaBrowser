const BasaltCatalog = require('./BasaltCatalog');
const BasaltModelEntries = require('./BasaltModelEntries');

class BasaltActivation {
  static UNAVAILABLE_WARNING = 'context.llmCatalog is unavailable; this LumaBrowser build predates LLM runtime extensions.';

  static async activate(context, platform = process.platform, arch = process.arch) {
    const api = context && context.llmCatalog;
    if (!api || typeof api.registerRuntime !== 'function') {
      if (context && context.logger) context.logger.warn(BasaltActivation.UNAVAILABLE_WARNING);
      return {};
    }
    const hostKeys = [platform, `${platform}-${arch}`];
    if (!BasaltCatalog.PLATFORMS.some((key) => hostKeys.includes(key))) return {};
    BasaltActivation._registerRuntimes(api);
    BasaltActivation._registerModels(api);
    BasaltActivation._logRegistered(context);
    return {};
  }

  static _registerRuntimes(api) {
    const BasaltRuntimeHooks = require('./BasaltRuntimeHooks');
    for (const entry of BasaltCatalog.RUNTIME_ENTRIES) api.registerRuntime(entry, BasaltRuntimeHooks.hooks());
  }

  static _registerModels(api) {
    for (const entry of BasaltModelEntries.ENTRIES) api.registerModel(entry);
  }

  static _logRegistered(context) {
    if (!context.logger) return;
    context.logger.info(`registered runtimes ${BasaltCatalog.RUNTIME_IDS.join(', ')} and ${BasaltModelEntries.ENTRIES.length} add-on models`);
  }
}

module.exports = BasaltActivation;
