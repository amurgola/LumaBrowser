const KvCacheModes = require('../../shared/llm/KvCacheModes');
const OpenVinoDevice = require('../runtimes/OpenVinoDevice');
const FrameworkOptionDeclarations = require('../runtimes/FrameworkOptionDeclarations');
const LlmDefaults = require('./LlmDefaults');

class FrameworkOptionValue {
  static normalize(optionId, value, custom = null) {
    if (value === null || value === undefined) return null;
    if (custom) return FrameworkOptionValue._custom(custom, value);
    if (optionId === 'kvCacheType') return KvCacheModes.MODE_IDS.includes(value) ? String(value) : null;
    if (optionId === 'maxConcurrent') return FrameworkOptionValue._slots(value);
    if (optionId === 'openvinoDevice') return OpenVinoDevice.normalize(value);
    if (LlmDefaults.FLAG_FIELDS.includes(optionId)) return FrameworkOptionValue._boolean(value);
    return value;
  }

  static fromDefaultsPatch(optionId, value) {
    return optionId === 'kvCacheType' && (value === null || value === '') ? KvCacheModes.MODE_IDS[0] : value;
  }

  static unset(optionId) {
    if (optionId === 'maxConcurrent') return LlmDefaults.DEFAULT_PARALLEL;
    return LlmDefaults.FLAG_FIELDS.includes(optionId) ? false : null;
  }

  static _custom(custom, value) {
    if (custom.kind === FrameworkOptionDeclarations.TOGGLE) return FrameworkOptionValue._boolean(value);
    const id = String(value);
    return custom.choices.some((choice) => choice.id === id) ? id : null;
  }

  static _slots(value) {
    const count = Number(value);
    return Number.isFinite(count) && count >= 1 ? Math.min(LlmDefaults.MAX_PARALLEL, Math.floor(count)) : null;
  }

  static _boolean(value) {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return null;
  }
}

module.exports = FrameworkOptionValue;
