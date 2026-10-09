const http = require('http');
const https = require('https');
const ModelIdRewriter = require('./ModelIdRewriter');

class UpstreamProxy {
  static forward({ req, res, upstream, path, body, log }) {
    return new UpstreamProxy({ req, res, upstream, path, body, log }).execute();
  }

  constructor({ req, res, upstream, path, body, log }) {
    this._req = req;
    this._res = res;
    this._upstream = upstream;
    this._path = path;
    this._body = body;
    this._log = log;
  }

  execute() {
    const url = this._resolveUrl();
    if (!url) return;
    const payload = Buffer.from(JSON.stringify(this._body));
    const upstreamRequest = this._open(url, payload);
    this._abortWhenClientLeaves(upstreamRequest);
    upstreamRequest.end(payload);
  }

  _resolveUrl() {
    try {
      return new URL(this._path, this._upstream.baseUrl);
    } catch (error) {
      this._res.status(502).json({ error: { message: `Bad upstream URL: ${error.message}` } });
      return null;
    }
  }

  _open(url, payload) {
    const transport = url.protocol === 'https:' ? https : http;
    const request = transport.request(url, { method: 'POST', headers: this._headers(payload) }, (upstreamResponse) => this._relay(upstreamResponse));
    request.on('error', (error) => this._onUnreachable(error));
    return request;
  }

  _headers(payload) {
    const headers = {
      'content-type': 'application/json',
      'content-length': payload.length,
      accept: this._req.headers.accept || '*/*',
    };
    if (this._upstream.apiKey) headers.authorization = `Bearer ${this._upstream.apiKey}`;
    return headers;
  }

  _relay(upstreamResponse) {
    this._copyHead(upstreamResponse);
    upstreamResponse.on('error', () => this._endQuietly());
    if (this._upstream.modelId) upstreamResponse.pipe(ModelIdRewriter.create(this._upstream.modelId)).pipe(this._res);
    else upstreamResponse.pipe(this._res);
  }

  _copyHead(upstreamResponse) {
    this._res.status(upstreamResponse.statusCode || 502);
    const contentType = upstreamResponse.headers['content-type'];
    if (contentType) this._res.setHeader('Content-Type', contentType);
    if (/text\/event-stream/i.test(String(contentType || ''))) this._prepareEventStream();
  }

  _prepareEventStream() {
    this._res.setHeader('Cache-Control', 'no-cache, no-transform');
    this._res.setHeader('Connection', 'keep-alive');
    this._res.setHeader('X-Accel-Buffering', 'no');
    if (typeof this._res.flushHeaders === 'function') this._res.flushHeaders();
  }

  _onUnreachable(error) {
    const message = `Could not reach the local model server: ${(error && error.message) || error}`;
    this._log(message);
    if (!this._res.headersSent) this._res.status(502).json({ error: { message, type: 'server_error' } });
    else this._endQuietly();
  }

  _abortWhenClientLeaves(upstreamRequest) {
    this._res.on('close', () => {
      if (!this._res.writableFinished) upstreamRequest.destroy();
    });
  }

  _endQuietly() {
    try { this._res.end(); } catch (_) {}
  }
}

module.exports = UpstreamProxy;
