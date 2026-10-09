const http = require('http');
const https = require('https');

class JsonHttpClient {
  static request(method, url, { body, timeout, headers } = {}) {
    return new Promise((resolve, reject) => {
      const target = new URL(url);
      const transport = target.protocol === 'https:' ? https : http;
      const payload = body === undefined ? null : Buffer.from(JSON.stringify(body), 'utf8');
      const req = transport.request(target, { method, headers: JsonHttpClient._headers(payload, headers) }, (res) => {
        JsonHttpClient._readJson(res, resolve, reject);
      });
      if (timeout) {
        req.setTimeout(timeout, () => req.destroy(new Error(`timeout of ${timeout}ms exceeded`)));
      }
      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
  }

  static _headers(payload, extra) {
    return {
      Accept: 'application/json',
      ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': payload.length } : {}),
      ...(extra || {}),
    };
  }

  static _readJson(res, resolve, reject) {
    const chunks = [];
    res.on('data', (chunk) => chunks.push(chunk));
    res.on('error', reject);
    res.on('end', () => resolve({ status: res.statusCode, data: JsonHttpClient._parse(Buffer.concat(chunks).toString('utf8')) }));
  }

  static _parse(text) {
    try { return text ? JSON.parse(text) : null; } catch (_) { return null; }
  }
}

module.exports = JsonHttpClient;
