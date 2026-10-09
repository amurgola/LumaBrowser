const { net } = require('electron');
const LumaRequestSigner = require('./LumaRequestSigner');

class SignedLumaClient {
  static DEFAULT_TIMEOUT_MS = 6000;

  constructor({ baseUrl, identity, allowEgress, label = 'LumaByte', defaultHeaders = {} } = {}) {
    SignedLumaClient._assertEgressPolicy(allowEgress, label);
    this._baseUrl = baseUrl;
    this._identity = identity;
    this._allowEgress = allowEgress;
    this._label = label;
    this._defaultHeaders = defaultHeaders;
  }

  static headerValue(header) {
    if (Array.isArray(header)) return header[0] || '';
    return header == null ? '' : String(header);
  }

  request({ method, url, body, timeoutMs = SignedLumaClient.DEFAULT_TIMEOUT_MS, headers = null }) {
    return new Promise((resolve) => {
      if (!this._allowEgress()) return resolve(null);
      const call = this._startCall(method, url, resolve);
      if (!call) return;
      this._applyHeaders(call.req, headers);
      this._armTimeout(call, timeoutMs);
      this._listen(call);
      this._send(call.req, body);
    });
  }

  static _assertEgressPolicy(allowEgress, label) {
    if (typeof allowEgress === 'function') return;
    throw new Error(
      `SignedLumaClient(${label}): allowEgress is required and must be a function. `
      + 'State the egress policy explicitly at the construction site.',
    );
  }

  _startCall(method, url, resolve) {
    const call = { method, url, req: null, timer: null, settled: false };
    call.settle = (value) => {
      if (call.settled) return;
      call.settled = true;
      clearTimeout(call.timer);
      resolve(value);
    };
    try {
      call.req = net.request({ method, url });
    } catch (err) {
      console.warn(`${this._label}: failed to create request:`, err.message);
      call.settle(null);
      return null;
    }
    return call;
  }

  _applyHeaders(req, extraHeaders) {
    const headers = {
      ...this._defaultHeaders,
      ...LumaRequestSigner.buildAuthHeaders(this._identity),
      ...(extraHeaders || {}),
    };
    for (const [name, value] of Object.entries(headers)) req.setHeader(name, value);
  }

  _armTimeout(call, timeoutMs) {
    call.timer = setTimeout(() => {
      try { call.req.abort(); } catch {}
      call.settle(null);
    }, timeoutMs);
  }

  _listen(call) {
    call.req.on('response', (response) => this._bufferResponse(call, response));
    call.req.on('error', (err) => {
      console.warn(`${this._label}: ${call.method} ${call.url} failed:`, err.message);
      call.settle(null);
    });
  }

  _bufferResponse(call, response) {
    const chunks = [];
    response.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    response.on('end', () => call.settle({
      statusCode: response.statusCode,
      headers: response.headers || {},
      body: Buffer.concat(chunks),
    }));
    response.on('error', () => call.settle(null));
  }

  _send(req, body) {
    if (body) req.write(body);
    req.end();
  }
}

module.exports = SignedLumaClient;
