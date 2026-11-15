class ClientRequestKnobs {
  static SAMPLER_KEYS = Object.freeze([
    'top_p', 'top_k', 'min_p', 'typical_p',
    'repeat_penalty', 'repeat_last_n', 'presence_penalty', 'frequency_penalty',
    'dry_multiplier', 'dry_base', 'dry_allowed_length', 'dry_penalty_last_n',
    'xtc_probability', 'xtc_threshold',
    'reasoning_budget_tokens',
  ]);
  static PIN_TEMPERATURE = 'luma_pin_temperature';
  static AGENT_TURN = 'luma_agent_turn';
  static COMPLEXITY = 'luma_complexity';
  static CALL_TYPE = 'luma_call_type';
  static COMPLEXITIES = Object.freeze(['heavy', 'light']);
  static CALL_TYPES = Object.freeze(['side', 'title', 'compact']);

  static apply(extra, body) {
    const knobs = ClientRequestKnobs.of(body);
    return Object.keys(knobs).length ? { ...(extra || {}), ...knobs } : extra;
  }

  static of(body) {
    const b = body && typeof body === 'object' ? body : {};
    const out = {};
    const cap = ClientRequestKnobs._cap(b);
    if (cap) out.maxTokens = cap;
    const samplers = ClientRequestKnobs._samplers(b);
    if (samplers) out.samplerOverrides = samplers;
    if (b[ClientRequestKnobs.PIN_TEMPERATURE] === true) out.pinTemperature = true;
    if (b[ClientRequestKnobs.AGENT_TURN] === true) out.agentTurn = true;
    if (ClientRequestKnobs.COMPLEXITIES.includes(b[ClientRequestKnobs.COMPLEXITY])) out.complexity = b[ClientRequestKnobs.COMPLEXITY];
    if (ClientRequestKnobs.CALL_TYPES.includes(b[ClientRequestKnobs.CALL_TYPE])) out.clientCallType = b[ClientRequestKnobs.CALL_TYPE];
    return out;
  }

  static _cap(body) {
    for (const key of ['max_tokens', 'max_completion_tokens']) {
      const n = body[key];
      if (typeof n === 'number' && Number.isFinite(n) && n > 0) return Math.floor(n);
    }
    return null;
  }

  static _samplers(body) {
    const out = {};
    for (const key of ClientRequestKnobs.SAMPLER_KEYS) {
      const value = body[key];
      if (typeof value === 'number' && Number.isFinite(value)) out[key] = value;
    }
    return Object.keys(out).length ? out : null;
  }
}

module.exports = ClientRequestKnobs;
