const PseudoToolSchemaTable = require('./tool-schemas/PseudoToolSchemaTable');
const FunctionSchema = require('./tool-schemas/FunctionSchema');

class RequestComplexity {
  static HEAVY = 'heavy';
  static LIGHT = 'light';

  static MOE_CACHE_BATCH_HEAVY = 128;

  static heavyToolNames() {
    return PseudoToolSchemaTable.ENTRIES
      .filter((entry) => entry.complexity === RequestComplexity.HEAVY)
      .map((entry) => entry.name);
  }

  static of({ extra = null, tools = null } = {}) {
    if (extra && extra.complexity === RequestComplexity.HEAVY) return RequestComplexity.HEAVY;
    if (extra && extra.complexity === RequestComplexity.LIGHT) return RequestComplexity.LIGHT;
    const heavy = new Set(RequestComplexity.heavyToolNames());
    const offered = Array.isArray(tools) ? tools.map(FunctionSchema.nameOf) : [];
    return offered.some((name) => heavy.has(name)) ? RequestComplexity.HEAVY : RequestComplexity.LIGHT;
  }

  static ofAllows(allows) {
    if (typeof allows !== 'function') return RequestComplexity.LIGHT;
    return RequestComplexity.heavyToolNames().some((name) => allows(name)) ? RequestComplexity.HEAVY : RequestComplexity.LIGHT;
  }

  static moeCacheBatch(extra, tools) {
    return RequestComplexity.of({ extra, tools }) === RequestComplexity.HEAVY ? RequestComplexity.MOE_CACHE_BATCH_HEAVY : undefined;
  }
}

module.exports = RequestComplexity;
