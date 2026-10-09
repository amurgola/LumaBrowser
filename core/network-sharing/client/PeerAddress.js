const os = require('os');

class PeerAddress {
  static DEFAULT_PORT = 3000;
  static IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;
  static RFC1918 = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

  static baseUrl(address, defaultPort = PeerAddress.DEFAULT_PORT) {
    const text = String(address || '').trim();
    if (!text) return null;
    const hadScheme = /^https?:\/\//i.test(text);
    const url = PeerAddress._parse(hadScheme ? text : `http://${text}`);
    if (!url) return null;
    if (!url.port && !hadScheme) url.port = String(defaultPort);
    return url.port ? `${url.protocol}//${url.hostname}:${url.port}` : `${url.protocol}//${url.hostname}`;
  }

  static pick(addresses, interfaces = PeerAddress._interfaces()) {
    const candidates = (addresses || []).filter((address) => PeerAddress.IPV4.test(address));
    if (!candidates.length) return null;
    const local = PeerAddress._localIpv4(interfaces);
    return candidates.find((address) => PeerAddress._onSharedSubnet(address, local))
      || candidates.find((address) => PeerAddress.RFC1918.test(address))
      || candidates[0];
  }

  static _parse(text) {
    try {
      return new URL(text);
    } catch (_) {
      return null;
    }
  }

  static _interfaces() {
    try {
      return os.networkInterfaces();
    } catch (_) {
      return {};
    }
  }

  static _localIpv4(interfaces) {
    const local = [];
    for (const list of Object.values(interfaces || {})) {
      for (const addr of (list || [])) {
        if (addr.internal) continue;
        if (addr.family !== 'IPv4' && addr.family !== 4) continue;
        if (addr.netmask) local.push(addr);
      }
    }
    return local;
  }

  static _onSharedSubnet(address, local) {
    return local.some((nic) => {
      const mask = PeerAddress._toInt(nic.netmask);
      return (PeerAddress._toInt(address) & mask) === (PeerAddress._toInt(nic.address) & mask);
    });
  }

  static _toInt(ip) {
    return String(ip).split('.').reduce((n, octet) => ((n << 8) | (Number(octet) & 255)) >>> 0, 0);
  }
}

module.exports = PeerAddress;
