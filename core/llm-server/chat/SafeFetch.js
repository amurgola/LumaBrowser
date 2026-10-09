const http = require('http');
const https = require('https');
const AddressGuard = require('./safe-fetch/AddressGuard');
const FetchOptions = require('./safe-fetch/FetchOptions');
const CappedBodyReader = require('./safe-fetch/CappedBodyReader');

class SafeFetch {
  static MAX_REDIRECTS = 5;
  static MAX_FETCH_BYTES = FetchOptions.MAX_FETCH_BYTES;

  static fetch(url, opts = {}) {
    return SafeFetch._hop(url, FetchOptions.from(opts), SafeFetch.MAX_REDIRECTS);
  }

  static async _hop(url, options, redirectsLeft) {
    const target = SafeFetch._target(url);
    if (target.error) return { ok: false, error: target.error };
    const outcome = await SafeFetch._send(url, target.parsed, options);
    if (!outcome.redirect) return outcome.result;
    return SafeFetch._follow(outcome.redirect, url, options, redirectsLeft);
  }

  static _target(url) {
    let parsed;
    try { parsed = new URL(url); } catch (_) { return { error: `Invalid URL: ${url}` }; }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { error: `Unsupported URL scheme "${parsed.protocol}" (only http/https).` };
    }
    const refusal = AddressGuard.literalRefusal(parsed.hostname);
    if (refusal) return { error: refusal };
    return { parsed };
  }

  static _send(url, parsed, options) {
    return new Promise((resolve) => {
      const lib = parsed.protocol === 'https:' ? https : http;
      const req = lib.request(url, { method: options.method, lookup: AddressGuard.lookup, headers: FetchOptions.headers(options) },
        (res) => SafeFetch._onResponse(res, url, options).then(resolve));
      req.on('error', (e) => resolve({ result: { ok: false, error: e.message } }));
      req.setTimeout(options.timeoutMs, () => req.destroy(new Error(`Timed out after ${Math.round(options.timeoutMs / 1000)}s`)));
      if (options.body != null) req.write(options.body);
      req.end();
    });
  }

  static async _onResponse(res, url, options) {
    const status = res.statusCode || 0;
    if (status >= 300 && status < 400 && res.headers.location && FetchOptions.followsRedirects(options)) {
      res.resume();
      return { redirect: res.headers.location };
    }
    return { result: await CappedBodyReader.read(res, { url, maxBytes: options.maxBytes }) };
  }

  static _follow(location, fromUrl, options, redirectsLeft) {
    if (redirectsLeft <= 0) return { ok: false, error: 'Too many redirects.' };
    let next;
    try { next = new URL(location, fromUrl).toString(); } catch (_) { return { ok: false, error: 'Bad redirect target.' }; }
    return SafeFetch._hop(next, options, redirectsLeft - 1);
  }
}

module.exports = SafeFetch;
