class WebhookBodyParser {
  static BINARY_PREVIEW_CHARS = 8192;

  static parse(raw, contentType = '') {
    const buf = Buffer.isBuffer(raw) ? raw : Buffer.alloc(0);
    if (!buf.length) return { body: null, bodyText: null };
    const type = String(contentType || '').toLowerCase();
    const text = buf.toString('utf8');
    if (WebhookBodyParser._isJson(type, text)) return WebhookBodyParser._json(text);
    if (type.includes('application/x-www-form-urlencoded')) return WebhookBodyParser._form(text);
    if (type.startsWith('text/') || type.includes('xml') || !type) return { body: null, bodyText: text };
    return WebhookBodyParser._binary(buf);
  }

  static _isJson(type, text) {
    return type.includes('json') || (!type && /^\s*[[{]/.test(text));
  }

  static _json(text) {
    try {
      return { body: JSON.parse(text), bodyText: null };
    } catch (_) {
      return { body: null, bodyText: text };
    }
  }

  static _form(text) {
    const body = {};
    for (const [key, value] of new URLSearchParams(text)) body[key] = value;
    if (typeof body.payload === 'string') body.payload = WebhookBodyParser._jsonOrText(body.payload);
    return { body, bodyText: null };
  }

  static _jsonOrText(text) {
    try {
      return JSON.parse(text);
    } catch (_) {
      return text;
    }
  }

  static _binary(buf) {
    return {
      body: null,
      bodyText: null,
      bodyBase64: buf.toString('base64').slice(0, WebhookBodyParser.BINARY_PREVIEW_CHARS),
      bodyBytes: buf.length,
    };
  }
}

module.exports = WebhookBodyParser;
