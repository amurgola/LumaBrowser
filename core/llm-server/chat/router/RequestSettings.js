const ModelOverrides = require('../../../shared/llm/ModelOverrides');

class RequestSettings {
  static HOUSEKEEPING = new Set(['compact', 'title', 'side']);

  static apply({ settings, temperature, extra, callType }) {
    const s = settings || {};
    let outTemp = temperature;
    let outExtra = extra;
    if (typeof s.temperature === 'number' && !RequestSettings.HOUSEKEEPING.has(callType)) {
      outTemp = s.temperature;
      outExtra = { ...(outExtra || {}), pinTemperature: true };
    }
    if (typeof s.maxReplyTokens === 'number') outExtra = { ...(outExtra || {}), maxReplyTokens: s.maxReplyTokens };
    const sampler = ModelOverrides.samplerBody(s);
    if (sampler) outExtra = { ...(outExtra || {}), modelSampler: sampler };
    return { temperature: outTemp, extra: outExtra };
  }

  static maxTokens(extra) {
    const caps = [extra && extra.maxTokens, extra && extra.maxReplyTokens].filter((n) => typeof n === 'number' && n > 0);
    return caps.length ? Math.min(...caps) : undefined;
  }
}

module.exports = RequestSettings;
