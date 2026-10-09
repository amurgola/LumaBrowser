const ChromeIdentity = require('../ChromeIdentity');

class ClientHintHeaders {
  static ALWAYS_LOWER = ['sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform'];

  static rewrite(headers) {
    if (!headers || typeof headers !== 'object') return headers;
    const requestedHighEntropy = ClientHintHeaders._removeExistingHints(headers);
    Object.assign(headers, ChromeIdentity.LOW_ENTROPY_HEADERS);
    ClientHintHeaders._addHighEntropy(headers, requestedHighEntropy);
    return headers;
  }

  static _removeExistingHints(headers) {
    const overrides = ChromeIdentity.HIGH_ENTROPY_OVERRIDES;
    const targets = new Set([...ClientHintHeaders.ALWAYS_LOWER, ...Object.keys(overrides)]);
    const present = new Set();
    for (const key of Object.keys(headers)) {
      const lower = key.toLowerCase();
      if (overrides[lower] !== undefined) present.add(lower);
      if (targets.has(lower)) delete headers[key];
    }
    return present;
  }

  static _addHighEntropy(headers, requested) {
    for (const lower of requested) {
      headers[ClientHintHeaders._canonicalName(lower)] = ChromeIdentity.HIGH_ENTROPY_OVERRIDES[lower];
    }
  }

  static _canonicalName(lower) {
    return lower.replace(/(^|-)([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
  }
}

module.exports = ClientHintHeaders;
