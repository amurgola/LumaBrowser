const ClientHintHeaders = require('../../core/browser/identity/ClientHintHeaders');

class InternalBearerInjector {
  static NAVIGATION = 'mainFrame';

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
      if (this._isLocalApi(details.url) && this._isOurs(details)) this._addBearer(headers);
    } catch (_) {}
    return headers;
  }

  _isLocalApi(url) {
    return typeof url === 'string' && url.startsWith(this._localPrefix);
  }

  _isOurs(details) {
    if (details.resourceType === InternalBearerInjector.NAVIGATION) return true;
    return InternalBearerInjector._askingPages(details).some((url) => this._isLocalApi(url));
  }

  _addBearer(headers) {
    if (!this._apiSecurity.getConfig().requireApiKey) return;
    const hasAuth = Object.keys(headers).some((k) => k.toLowerCase() === 'authorization');
    if (!hasAuth) headers.Authorization = `Bearer ${this._apiSecurity.internalToken()}`;
  }

  static _askingPages(details) {
    const frame = details.frame || null;
    const frames = frame ? [frame, InternalBearerInjector._read(frame, 'parent'), InternalBearerInjector._read(frame, 'top')] : [];
    return [...frames.map((each) => InternalBearerInjector._read(each, 'url')), details.referrer].filter((url) => typeof url === 'string');
  }

  static _read(frame, property) {
    try { return frame ? frame[property] : null; } catch (_) { return null; }
  }
}

module.exports = InternalBearerInjector;
