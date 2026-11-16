const ApiKeyEntry = require('../../shell/api-security/ApiKeyEntry');
const LoopbackRequestGuard = require('./LoopbackRequestGuard');

class ExposedServerKeyGuard {
  static QUERY_PARAMETER = 'token';

  static SOURCE_HEADER = 'header';

  static SOURCE_BASIC = 'basic';

  static SOURCE_QUERY = 'query';

  static UNAUTHORIZED = 401;

  static FORBIDDEN = 403;

  static NO_KEY_CONFIGURED = 'Binding to a network address needs an API key. Create one in Settings > API & MCP, '
    + 'or bind to 127.0.0.1.';

  static KEY_REFUSED = 'Invalid or missing API key. Send it as Authorization: Bearer <key>, X-Api-Key: <key>, '
    + 'Basic auth with the key as the password, or ?token=<key>.';

  static isExposed(bindHost) {
    const name = LoopbackRequestGuard.hostnameOf(String(bindHost == null ? '' : bindHost).trim());
    return !LoopbackRequestGuard.LOOPBACK_NAMES.includes(name);
  }

  static startRefusal(bindHost, apiSecurity) {
    if (!ExposedServerKeyGuard.isExposed(bindHost)) return null;
    return ExposedServerKeyGuard._hasAnyKey(apiSecurity) ? null : ExposedServerKeyGuard.NO_KEY_CONFIGURED;
  }

  static refusal(req, bindHost, apiSecurity) {
    if (!ExposedServerKeyGuard.isExposed(bindHost)) return ExposedServerKeyGuard._loopbackRefusal(req, bindHost);
    if (ExposedServerKeyGuard._keyAccepted(req, apiSecurity)) return null;
    return { status: ExposedServerKeyGuard.UNAUTHORIZED, reason: ExposedServerKeyGuard.KEY_REFUSED };
  }

  static presentedKey(req) {
    const headers = (req && req.headers) || {};
    const fromHeader = ApiKeyEntry.fromHeaders(headers);
    if (fromHeader) return { key: fromHeader, source: ExposedServerKeyGuard.SOURCE_HEADER };
    const fromBasic = ExposedServerKeyGuard._basicPassword(headers.authorization);
    if (fromBasic) return { key: fromBasic, source: ExposedServerKeyGuard.SOURCE_BASIC };
    const fromQuery = ExposedServerKeyGuard._queryToken(req && req.url);
    return fromQuery ? { key: fromQuery, source: ExposedServerKeyGuard.SOURCE_QUERY } : null;
  }

  static queryKeyToCarry(req, bindHost) {
    if (!ExposedServerKeyGuard.isExposed(bindHost)) return null;
    const presented = ExposedServerKeyGuard.presentedKey(req);
    return presented && presented.source === ExposedServerKeyGuard.SOURCE_QUERY ? presented.key : null;
  }

  static routedUrl(req, bindHost) {
    const url = String((req && req.url) || '');
    if (!ExposedServerKeyGuard.isExposed(bindHost)) return url;
    const queryStart = url.indexOf('?');
    if (queryStart < 0) return url;
    const kept = url.slice(queryStart + 1).split('&').filter((part) => !ExposedServerKeyGuard._isTokenPart(part));
    return kept.length ? `${url.slice(0, queryStart)}?${kept.join('&')}` : url.slice(0, queryStart);
  }

  static _loopbackRefusal(req, bindHost) {
    const reason = LoopbackRequestGuard.refusal(req, bindHost);
    return reason ? { status: ExposedServerKeyGuard.FORBIDDEN, reason } : null;
  }

  static _keyAccepted(req, apiSecurity) {
    const presented = ExposedServerKeyGuard.presentedKey(req);
    return !!(presented && apiSecurity && apiSecurity.isValidKey(presented.key));
  }

  static _hasAnyKey(apiSecurity) {
    if (!apiSecurity || typeof apiSecurity.getConfig !== 'function') return false;
    const keys = apiSecurity.getConfig().apiKeys;
    return Array.isArray(keys) && keys.length > 0;
  }

  static _basicPassword(authorization) {
    if (typeof authorization !== 'string') return null;
    const match = /^Basic\s+(\S+)$/i.exec(authorization.trim());
    if (!match) return null;
    const decoded = Buffer.from(match[1], 'base64').toString('utf8');
    const separator = decoded.indexOf(':');
    const password = separator < 0 ? '' : decoded.slice(separator + 1).trim();
    return password || null;
  }

  static _queryToken(url) {
    try {
      const token = new URL(String(url || ''), 'http://localhost').searchParams.get(ExposedServerKeyGuard.QUERY_PARAMETER);
      return token ? String(token) : null;
    } catch (_) {
      return null;
    }
  }

  static _isTokenPart(part) {
    const name = part.split('=')[0];
    try {
      return decodeURIComponent(name) === ExposedServerKeyGuard.QUERY_PARAMETER;
    } catch (_) {
      return name === ExposedServerKeyGuard.QUERY_PARAMETER;
    }
  }
}

module.exports = ExposedServerKeyGuard;
