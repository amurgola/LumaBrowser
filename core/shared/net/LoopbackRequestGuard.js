const net = require('net');

class LoopbackRequestGuard {
  static LOOPBACK_NAMES = ['localhost', '127.0.0.1', '::1'];

  static WILDCARD_HOSTS = ['', '0.0.0.0', '::'];

  static ORIGIN_SCHEMES = { 'http:': 80, 'https:': 443 };

  static HOST_PATTERN = /^(\[[0-9a-f:.]+\]|[^:[\]]+)(?::(\d{1,5}))?$/;

  static HOST_REFUSED = 'Host header not allowed: automation servers only answer loopback names';

  static ORIGIN_REFUSED = 'Origin not allowed: browser pages may not drive the automation server';

  static refusal(req, bindHost) {
    const headers = (req && req.headers) || {};
    if (!LoopbackRequestGuard._hostAllowed(headers.host, bindHost)) return LoopbackRequestGuard.HOST_REFUSED;
    if (!LoopbackRequestGuard._originAllowed(headers.origin, LoopbackRequestGuard._localPort(req))) {
      return LoopbackRequestGuard.ORIGIN_REFUSED;
    }
    return null;
  }

  static isAllowed(req, bindHost) {
    return LoopbackRequestGuard.refusal(req, bindHost) === null;
  }

  static rejectUpgrade(socket, reason) {
    const body = JSON.stringify({ error: reason });
    const head = [
      'HTTP/1.1 403 Forbidden',
      'Connection: close',
      'Content-Type: application/json; charset=utf-8',
      `Content-Length: ${Buffer.byteLength(body)}`,
    ].join('\r\n');
    try { socket.end(`${head}\r\n\r\n${body}`); } catch (_) { socket.destroy(); }
  }

  static hostnameOf(header) {
    if (typeof header !== 'string' || header === '') return null;
    const text = header.toLowerCase();
    if (text === '::1') return text;
    const match = LoopbackRequestGuard.HOST_PATTERN.exec(text);
    return match ? LoopbackRequestGuard._unbracket(match[1]) : null;
  }

  static _hostAllowed(header, bindHost) {
    const name = LoopbackRequestGuard.hostnameOf(header);
    if (name === null) return false;
    return LoopbackRequestGuard.LOOPBACK_NAMES.includes(name) || name === LoopbackRequestGuard._bindName(bindHost);
  }

  static _bindName(bindHost) {
    const name = LoopbackRequestGuard._unbracket(String(bindHost == null ? '' : bindHost).toLowerCase());
    return LoopbackRequestGuard.WILDCARD_HOSTS.includes(name) ? null : name;
  }

  static _originAllowed(origin, localPort) {
    if (origin === undefined) return true;
    const parsed = LoopbackRequestGuard._parseOrigin(origin);
    if (!parsed || !(parsed.protocol in LoopbackRequestGuard.ORIGIN_SCHEMES)) return false;
    if (!LoopbackRequestGuard.LOOPBACK_NAMES.includes(LoopbackRequestGuard._unbracket(parsed.hostname))) return false;
    return LoopbackRequestGuard._effectivePort(parsed) === localPort;
  }

  static _parseOrigin(origin) {
    try { return new URL(String(origin)); } catch (_) { return null; }
  }

  static _effectivePort(url) {
    return url.port ? Number(url.port) : LoopbackRequestGuard.ORIGIN_SCHEMES[url.protocol];
  }

  static _localPort(req) {
    const port = req && req.socket ? req.socket.localPort : undefined;
    return Number.isInteger(port) ? port : null;
  }

  static _unbracket(name) {
    const inner = name.startsWith('[') && name.endsWith(']') ? name.slice(1, -1) : name;
    return net.isIPv6(inner) && inner === '0:0:0:0:0:0:0:1' ? '::1' : inner;
  }
}

module.exports = LoopbackRequestGuard;
