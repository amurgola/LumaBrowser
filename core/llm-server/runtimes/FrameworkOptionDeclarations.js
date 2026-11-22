const RuntimeFlags = require('../server/launch/RuntimeFlags');
const OpenVinoDevice = require('./OpenVinoDevice');
const RuntimeFrameworks = require('./RuntimeFrameworks');

class FrameworkOptionDeclarations {
  static KNOWN_IDS = Object.freeze([
    'kvCacheType', 'maxConcurrent', 'tensorSplit', 'noMoeGpuCache', 'cacheReuse', 'usePeerGpus', 'pinModelRam', 'openvinoDevice',
  ]);
  static TOGGLE = 'toggle';
  static CHOICE = 'choice';
  static CACHE_REUSE_FLAG = '--cache-reuse';
  static LLAMA_BASE_IDS = Object.freeze(['kvCacheType', 'maxConcurrent', 'noMoeGpuCache', 'usePeerGpus', 'pinModelRam']);
  static OTHER_BASE_IDS = Object.freeze(['maxConcurrent']);

  static of(entry) {
    if (!entry) return [];
    const declared = Array.isArray(entry.options) ? entry.options : FrameworkOptionDeclarations._defaultIds(entry);
    return declared.map(FrameworkOptionDeclarations._normalize).filter(Boolean);
  }

  static customOf(entries, optionId) {
    for (const entry of entries || []) {
      const found = FrameworkOptionDeclarations.of(entry).find((option) => option.id === optionId && option.custom);
      if (found) return found.custom;
    }
    return null;
  }

  static _defaultIds(entry) {
    if (!FrameworkOptionDeclarations._isLlamaStyle(entry)) return FrameworkOptionDeclarations.OTHER_BASE_IDS.slice();
    const ids = FrameworkOptionDeclarations.LLAMA_BASE_IDS.slice();
    if (RuntimeFlags.TENSOR_SPLIT_RUNTIME_IDS.includes(entry.id)) ids.push('tensorSplit');
    if (!FrameworkOptionDeclarations._unsupported(entry, FrameworkOptionDeclarations.CACHE_REUSE_FLAG)) ids.push('cacheReuse');
    if (OpenVinoDevice.appliesTo(entry.id)) ids.push('openvinoDevice');
    return ids;
  }

  static _isLlamaStyle(entry) {
    const kinds = Array.isArray(entry.modelKinds) && entry.modelKinds.length > 0;
    return !kinds && entry.launchStyle !== RuntimeFrameworks.MLX_LAUNCH_STYLE;
  }

  static _unsupported(entry, flag) {
    return Array.isArray(entry.unsupportedFlags) && entry.unsupportedFlags.includes(flag);
  }

  static _normalize(option) {
    if (typeof option === 'string') return FrameworkOptionDeclarations.KNOWN_IDS.includes(option) ? { id: option, custom: null } : null;
    if (!option || typeof option !== 'object' || !option.id || FrameworkOptionDeclarations.KNOWN_IDS.includes(option.id)) return null;
    const custom = FrameworkOptionDeclarations._custom(option);
    return custom ? { id: String(option.id), custom } : null;
  }

  static _custom(option) {
    const base = { label: String(option.label || option.id), caption: option.caption || '', help: option.help || '', ramNote: option.ramNote || null };
    if (option.kind === FrameworkOptionDeclarations.TOGGLE) return { ...base, kind: option.kind, choices: [], default: option.default === true };
    if (option.kind !== FrameworkOptionDeclarations.CHOICE) return null;
    const choices = (Array.isArray(option.choices) ? option.choices : [])
      .filter((choice) => choice && choice.id != null)
      .map((choice) => ({ id: String(choice.id), label: String(choice.label || choice.id) }));
    if (choices.length === 0) return null;
    const wanted = option.default != null ? String(option.default) : null;
    return { ...base, kind: option.kind, choices, default: choices.some((choice) => choice.id === wanted) ? wanted : choices[0].id };
  }
}

module.exports = FrameworkOptionDeclarations;
