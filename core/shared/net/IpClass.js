const net = require('net');

class IpClass {
  static V4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  static V4_MAPPED = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i;
  static LAN_CLASSES = ['loopback', 'private', 'link-local', 'cgnat'];

  static classifyIp(ip) {
    const address = IpClass.normalizeIp(ip);
    if (!address) return 'invalid';
    const octets = IpClass._parseDottedQuad(address);
    if (octets) return octets.some((n) => n > 255) ? 'invalid' : IpClass._classifyV4(octets);
    if (net.isIPv6(address)) return IpClass._classifyV6(address.toLowerCase());
    return 'invalid';
  }

  static isLanPeer(ip) {
    return IpClass.LAN_CLASSES.includes(IpClass.classifyIp(ip));
  }

  static isConnectableTarget(ip) {
    return IpClass.classifyIp(ip) === 'public';
  }

  static isLoopbackIp(ip) {
    return IpClass.classifyIp(ip) === 'loopback';
  }

  static normalizeIp(ip) {
    const text = String(ip == null ? '' : ip);
    const mapped = IpClass.V4_MAPPED.exec(text);
    return mapped ? mapped[1] : text;
  }

  static clientIp(req) {
    return IpClass.normalizeIp((req && req.socket && req.socket.remoteAddress) || '');
  }

  static _parseDottedQuad(address) {
    const match = IpClass.V4.exec(address);
    return match ? match.slice(1, 5).map(Number) : null;
  }

  static _classifyV4([a, b, c]) {
    if (a === 0) return 'reserved';
    if (a === 10) return 'private';
    if (a === 127) return 'loopback';
    if (a === 100 && b >= 64 && b <= 127) return 'cgnat';
    if (a === 169 && b === 254) return 'link-local';
    if (a === 172 && b >= 16 && b <= 31) return 'private';
    if (a === 192 && b === 168) return 'private';
    if (a === 192 && b === 0 && (c === 0 || c === 2)) return 'reserved';
    if (a === 198 && (b === 18 || b === 19)) return 'reserved';
    if (a === 198 && b === 51 && c === 100) return 'reserved';
    if (a === 203 && b === 0 && c === 113) return 'reserved';
    if (a >= 224 && a <= 239) return 'multicast';
    if (a >= 240) return 'reserved';
    return 'public';
  }

  static _classifyV6(lower) {
    if (lower === '::') return 'reserved';
    if (lower === '::1') return 'loopback';
    if (/^fe[89ab]/.test(lower)) return 'link-local';
    if (lower.startsWith('fc') || lower.startsWith('fd')) return 'private';
    if (lower.startsWith('ff')) return 'multicast';
    return 'public';
  }
}

module.exports = IpClass;
