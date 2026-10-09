const HostIsa = require('./HostIsa');
const IkLlamaCatalog = require('./IkLlamaCatalog');

class IkLlamaActivation {
  static UNAVAILABLE_WARNING = 'context.llmCatalog is unavailable; this LumaBrowser build predates LLM runtime extensions.';

  static async activate(context) {
    const api = context && context.llmCatalog;
    if (!IkLlamaActivation._hasCatalogSeam(api)) {
      IkLlamaActivation._warnUnavailable(context);
      return {};
    }
    const isa = HostIsa.detect();
    const entries = IkLlamaCatalog.buildRuntimeEntries({ isa: isa.isa });
    for (const entry of entries) api.registerRuntime(entry, null);
    IkLlamaActivation._logRegistered(context, entries, isa);
    return {};
  }

  static _hasCatalogSeam(api) {
    return !!api && typeof api.registerRuntime === 'function';
  }

  static _warnUnavailable(context) {
    if (context && context.logger) context.logger.warn(IkLlamaActivation.UNAVAILABLE_WARNING);
  }

  static _logRegistered(context, entries, isa) {
    if (!context.logger) return;
    const ids = entries.map((e) => e.id).join(', ');
    context.logger.info(`registered ${entries.length} ik_llama runtime rows (${ids}); CPU build variant ${isa.isa} via ${isa.source}`);
  }
}

module.exports = IkLlamaActivation;
