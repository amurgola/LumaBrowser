const ClientHintHeaders = require('../../core/browser/identity/ClientHintHeaders');

class InternalBearerInjector {
  constructor({ apiSecurity, port }) {
    this._apiSecurity = apiSecurity;
    this._localPrefix = `http://127.0.0.1:${port}/`;
    this._hooked = new WeakSet();
  }

  attach(session) {
    if (!session || this._hooked.has(session)) return false;
    this._hooked.add(session);
    session.webRequest.onBeforeSendHeaders((details, callback) => callback({ requestHeaders: this.headersFor(details) }));
    return true;
  }

  headersFor(details) {
    const headers = ClientHintHeaders.rewrite((details && details.requestHeaders) || {});
    try {
      if (this._isLocalApi(details.url)) this._addBearer(headers);
    } catch (_) {}
    return headers;
  }

  _isLocalApi(url) {
    return typeof url === 'string' && url.startsWith(this._localPrefix);
  }

  _addBearer(headers) {
    const cfg = this._apiSecurity.getConfig();
    if (!cfg.requireApiKey || !Array.isArray(cfg.apiKeys) || cfg.apiKeys.length === 0) return;
    const hasAuth = Object.keys(headers).some((k) => k.toLowerCase() === 'authorization');
    if (!hasAuth) headers.Authorization = `Bearer ${cfg.apiKeys[0].key}`;
  }
}

module.exports = InternalBearerInjector;
