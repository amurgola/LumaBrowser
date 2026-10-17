class RequestSettings {
  static HOUSEKEEPING = new Set(['compact', 'title']);

  static apply({ settings, temperature, extra, callType }) {
    const s = settings || {};
    let outTemp = temperature;
    let outExtra = extra;
    if (typeof s.temperature === 'number' && !RequestSettings.HOUSEKEEPING.has(callType)) {
      outTemp = s.temperature;
      outExtra = { ...(outExtra || {}), pinTemperature: true };
    }
    if (typeof s.maxReplyTokens === 'number') outExtra = { ...(outExtra || {}), maxReplyTokens: s.maxReplyTokens };
    return { temperature: outTemp, extra: outExtra };
  }

  static maxTokens(extra) {
    const caps = [extra && extra.maxTokens, extra && extra.maxReplyTokens].filter((n) => typeof n === 'number' && n > 0);
    return caps.length ? Math.min(...caps) : undefined;
  }
}

module.exports = RequestSettings;
