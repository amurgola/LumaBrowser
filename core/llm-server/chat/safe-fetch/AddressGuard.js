const dns = require('dns');
const net = require('net');
const IpClass = require('../../../shared/net/IpClass');

class AddressGuard {
  static HEX_MAPPED_V4 = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/;
  static REFUSAL_PATTERN = /blocked non-public address/;

  static isBlockedAddress(ip) {
    return !IpClass.isConnectableTarget(AddressGuard.canonical(ip));
  }

  static isBlockedIPv4(ip) {
    return !net.isIPv4(ip) || AddressGuard.isBlockedAddress(ip);
  }

  static isBlockedIPv6(ip) {
    return !net.isIPv6(ip) || AddressGuard.isBlockedAddress(ip);
  }

  static canonical(ip) {
    const text = String(ip == null ? '' : ip);
    if (!net.isIPv6(text)) return text;
    const compressed = AddressGuard._compressV6(text);
    const mapped = AddressGuard.HEX_MAPPED_V4.exec(compressed);
    return mapped ? AddressGuard._dottedFromHex(mapped[1], mapped[2]) : compressed;
  }

  static literalRefusal(hostname) {
    const host = String(hostname || '').replace(/^\[|\]$/g, '');
    if (!net.isIP(host) || !AddressGuard.isBlockedAddress(host)) return null;
    return AddressGuard._blockedError(host, hostname).message;
  }

  static lookup(hostname, options, callback) {
    const done = typeof options === 'function' ? options : callback;
    const opts = typeof options === 'function' ? {} : (options || {});
    dns.lookup(hostname, opts, (err, address, family) => {
      if (err) return done(err);
      const candidates = Array.isArray(address) ? address.map((a) => a.address) : [address];
      const blocked = candidates.find((candidate) => AddressGuard.isBlockedAddress(candidate));
      if (blocked !== undefined) return done(AddressGuard._blockedError(blocked, hostname));
      return Array.isArray(address) ? done(null, address) : done(null, address, family);
    });
  }

  static isRefusal(errorText) {
    return AddressGuard.REFUSAL_PATTERN.test(String(errorText || ''));
  }

  static _blockedError(address, hostname) {
    return new Error(`blocked non-public address ${address} for ${hostname}`);
  }

  static _compressV6(text) {
    try {
      return new URL(`http://[${text}]/`).hostname.slice(1, -1);
    } catch (_) {
      return text.toLowerCase();
    }
  }

  static _dottedFromHex(high, low) {
    const hi = parseInt(high, 16);
    const lo = parseInt(low, 16);
    return [hi >> 8, hi & 255, lo >> 8, lo & 255].join('.');
  }
}

module.exports = AddressGuard;
