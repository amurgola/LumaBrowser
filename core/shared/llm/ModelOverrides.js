const KvCacheModes = require('./KvCacheModes');
const ReasoningEffort = require('./ReasoningEffort');

class ModelOverrides {
  static MAX_TEMPERATURE = 2;
  static MAX_REPLY_TOKENS = 1000000;
  static MAX_PARALLEL_TOOL_CALLS = 8;
  static MAX_AGENT_TIMEOUT_MINUTES = 240;
  static MAX_AGENT_ITERATIONS = 400;

  static REQUEST_FIELDS = Object.freeze([
    'reasoningEffort', 'temperature', 'maxReplyTokens', 'maxParallelToolCalls', 'agentTimeoutMinutes', 'agentMaxIterations',
    'topP', 'topK', 'minP', 'repeatPenalty', 'presencePenalty',
  ]);
  static SAMPLER_KEYS = Object.freeze({ topP: 'top_p', topK: 'top_k', minP: 'min_p', repeatPenalty: 'repeat_penalty', presencePenalty: 'presence_penalty' });
  static SAMPLER_RANGES = Object.freeze({ topP: [0.01, 1], topK: [0, 1000], minP: [0, 1], repeatPenalty: [0.5, 2], presencePenalty: [-2, 2] });
  static INFO_FIELDS = Object.freeze(['settingsSource']);
  static MAX_SOURCE_CHARS = 200;
  static LAUNCH_FIELDS = Object.freeze(['kvCacheType']);

  static clean(raw, { launch = false } = {}) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const fields = launch ? [...ModelOverrides.REQUEST_FIELDS, ...ModelOverrides.LAUNCH_FIELDS] : ModelOverrides.REQUEST_FIELDS;
    const out = {};
    for (const field of fields) {
      const value = ModelOverrides._cleanField(field, src[field]);
      if (value !== null) out[field] = value;
    }
    const source = typeof src.settingsSource === 'string' ? src.settingsSource.trim().slice(0, ModelOverrides.MAX_SOURCE_CHARS) : '';
    if (source) out.settingsSource = source;
    return out;
  }

  static samplerBody(overrides) {
    const out = {};
    for (const [field, key] of Object.entries(ModelOverrides.SAMPLER_KEYS)) {
      if (overrides && typeof overrides[field] === 'number') out[key] = overrides[field];
    }
    return Object.keys(out).length ? out : null;
  }

  static merge(...layers) {
    return Object.assign({}, ...layers.filter((layer) => layer && typeof layer === 'object'));
  }

  static isEmpty(overrides) {
    return !overrides || Object.keys(overrides).filter((k) => !ModelOverrides.INFO_FIELDS.includes(k)).length === 0;
  }

  static _cleanField(field, value) {
    if (value === undefined || value === null || value === '') return null;
    if (field === 'reasoningEffort') return ModelOverrides._dial(value);
    if (field === 'temperature') return ModelOverrides._temperature(value);
    if (field === 'maxReplyTokens') return ModelOverrides._replyTokens(value);
    if (field === 'maxParallelToolCalls') return ModelOverrides._parallelToolCalls(value);
    if (field === 'agentTimeoutMinutes') return ModelOverrides._agentTimeoutMinutes(value);
    if (field === 'agentMaxIterations') return ModelOverrides._agentIterations(value);
    if (field === 'kvCacheType') return KvCacheModes.MODE_IDS.includes(value) ? String(value) : null;
    if (ModelOverrides.SAMPLER_RANGES[field]) return ModelOverrides._sampler(field, value);
    return null;
  }

  static _sampler(field, value) {
    const n = Number(value);
    const [min, max] = ModelOverrides.SAMPLER_RANGES[field];
    if (!Number.isFinite(n) || n < min || n > max) return null;
    return field === 'topK' ? Math.floor(n) : Math.round(n * 1000) / 1000;
  }

  static _parallelToolCalls(value) {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n) || n < 1) return null;
    return Math.min(n, ModelOverrides.MAX_PARALLEL_TOOL_CALLS);
  }

  static _agentTimeoutMinutes(value) {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.min(n, ModelOverrides.MAX_AGENT_TIMEOUT_MINUTES);
  }

  static _agentIterations(value) {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n) || n < 1) return null;
    return Math.min(n, ModelOverrides.MAX_AGENT_ITERATIONS);
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
