const ChromeIdentity = require('../../../browser/ChromeIdentity');
const ClientHintHeaders = require('../../../browser/identity/ClientHintHeaders');

class FetchOptions {
  static MAX_FETCH_BYTES = 512 * 1024;
  static DEFAULT_TIMEOUT_MS = 30000;
  static PROTECTED_HEADERS = new Set(['user-agent', 'host', 'content-length', 'connection', 'transfer-encoding']);
  static ACCEPT = 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5';

  static from(opts = {}) {
    const method = FetchOptions._method(opts.method);
    return {
      timeoutMs: opts.timeoutMs || FetchOptions.DEFAULT_TIMEOUT_MS,
      maxBytes: opts.maxBytes || FetchOptions.MAX_FETCH_BYTES,
      method,
      body: FetchOptions._body(method, opts.body),
      extraHeaders: FetchOptions._extraHeaders(opts.headers),
    };
  }

  static followsRedirects(options) {
    return options.method === 'GET' || options.method === 'HEAD';
  }

  static headers(options) {
    return ClientHintHeaders.rewrite({
      'User-Agent': ChromeIdentity.USER_AGENT,
      Accept: FetchOptions.ACCEPT,
      'Accept-Language': 'en-US,en;q=0.9',
      ...options.extraHeaders,
    });
  }

  static _method(method) {
    const upper = String(method || '').toUpperCase();
    return /^[A-Z]+$/.test(upper) ? upper : 'GET';
  }

  static _body(method, body) {
    if (method === 'GET' || method === 'HEAD' || body == null) return null;
    return String(body);
  }

  static _extraHeaders(headers) {
    const out = {};
    for (const [name, value] of Object.entries(headers || {})) {
      if (typeof value !== 'string') continue;
      if (FetchOptions.PROTECTED_HEADERS.has(String(name).toLowerCase())) continue;
      out[name] = value;
    }
    return out;
  }
}

module.exports = FetchOptions;
