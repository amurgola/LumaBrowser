const os = require('os');
const IpClass = require('../../shared/net/IpClass');

class LanAddress {
  static LOOPBACK = '127.0.0.1';

  static pick(interfaces = LanAddress._interfaces()) {
    const candidates = LanAddress._externalIpv4(interfaces);
    return candidates.find((address) => IpClass.classifyIp(address) === 'private') || candidates[0] || LanAddress.LOOPBACK;
  }

  static _externalIpv4(interfaces) {
    return Object.values(interfaces || {})
      .flatMap((addresses) => addresses || [])
      .filter((addr) => !addr.internal && addr.family === 'IPv4')
      .map((addr) => addr.address);
  }

  static _interfaces() {
    try {
      return os.networkInterfaces();
    } catch (_) {
      return {};
    }
  }
}

module.exports = LanAddress;
