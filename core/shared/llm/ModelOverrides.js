const KvCacheModes = require('./KvCacheModes');
const ReasoningEffort = require('./ReasoningEffort');

class ModelOverrides {
  static MAX_TEMPERATURE = 2;
  static MAX_REPLY_TOKENS = 1000000;
  static MAX_PARALLEL_TOOL_CALLS = 8;

  static REQUEST_FIELDS = Object.freeze(['reasoningEffort', 'temperature', 'maxReplyTokens', 'maxParallelToolCalls']);
  static LAUNCH_FIELDS = Object.freeze(['kvCacheType']);

  static clean(raw, { launch = false } = {}) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const fields = launch ? [...ModelOverrides.REQUEST_FIELDS, ...ModelOverrides.LAUNCH_FIELDS] : ModelOverrides.REQUEST_FIELDS;
    const out = {};
    for (const field of fields) {
      const value = ModelOverrides._cleanField(field, src[field]);
      if (value !== null) out[field] = value;
    }
    return out;
  }

  static merge(...layers) {
    return Object.assign({}, ...layers.filter((layer) => layer && typeof layer === 'object'));
  }

  static isEmpty(overrides) {
    return !overrides || Object.keys(overrides).length === 0;
  }

  static _cleanField(field, value) {
    if (value === undefined || value === null || value === '') return null;
    if (field === 'reasoningEffort') return ModelOverrides._dial(value);
    if (field === 'temperature') return ModelOverrides._temperature(value);
    if (field === 'maxReplyTokens') return ModelOverrides._replyTokens(value);
    if (field === 'maxParallelToolCalls') return ModelOverrides._parallelToolCalls(value);
    if (field === 'kvCacheType') return KvCacheModes.MODE_IDS.includes(value) ? String(value) : null;
    return null;
  }

  static _parallelToolCalls(value) {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n) || n < 1) return null;
    return Math.min(n, ModelOverrides.MAX_PARALLEL_TOOL_CALLS);
  }

  static _dial(value) {
    const id = String(value).trim().toLowerCase();
    return ReasoningEffort.DIAL_IDS.includes(id) ? id : null;
  }

  static _temperature(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.round(Math.min(n, ModelOverrides.MAX_TEMPERATURE) * 100) / 100;
  }

  static _replyTokens(value) {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n) || n < 1) return null;
    return Math.min(n, ModelOverrides.MAX_REPLY_TOKENS);
  }
}

module.exports = ModelOverrides;
