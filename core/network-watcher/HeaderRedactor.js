class HeaderRedactor {
  static REDACTED_HEADERS = Object.freeze(['cookie', 'authorization', 'set-cookie', 'proxy-authorization']);
  static _REDACTED_SET = new Set(HeaderRedactor.REDACTED_HEADERS);

  static redactHeaders(headers) {
    if (!HeaderRedactor._isHeaderObject(headers)) return headers;
    const clean = {};
    for (const [name, value] of Object.entries(headers)) {
      if (!HeaderRedactor._isCredential(name)) clean[name] = value;
    }
    return clean;
  }

  static redactCapturePayload(requestData) {
    if (!requestData || typeof requestData !== 'object') return requestData;
    const clean = { ...requestData };
    HeaderRedactor._redactSection(clean, 'request');
    HeaderRedactor._redactSection(clean, 'response');
    return clean;
  }

  static _redactSection(payload, section) {
    const part = payload[section];
    if (!part || typeof part !== 'object') return;
    payload[section] = { ...part, headers: HeaderRedactor.redactHeaders(part.headers) };
    if (payload[section].headers === undefined) delete payload[section].headers;
  }

  static _isHeaderObject(headers) {
    return !!headers && typeof headers === 'object' && !Array.isArray(headers);
  }

  static _isCredential(name) {
    return HeaderRedactor._REDACTED_SET.has(name.toLowerCase());
  }
}

module.exports = HeaderRedactor;
