const os = require('os');
const IpClass = require('../../../shared/net/IpClass');

class RpcBindAddress {
  static DOTTED_QUAD = /^\d{1,3}(\.\d{1,3}){3}$/;
  static REFUSED = ['127.0.0.1', '0.0.0.0'];

  static choose(candidate, interfaces = RpcBindAddress._interfaces()) {
    const local = String(candidate || '').replace(/^::ffff:/, '');
    if (RpcBindAddress._isUsable(local)) return local;
    return RpcBindAddress._firstPrivateLanAddress(interfaces);
  }

  static _isUsable(address) {
    return RpcBindAddress.DOTTED_QUAD.test(address) && !RpcBindAddress.REFUSED.includes(address);
  }

  static _firstPrivateLanAddress(interfaces) {
    for (const list of Object.values(interfaces || {})) {
      for (const addr of (list || [])) {
        if (addr.internal || (addr.family !== 'IPv4' && addr.family !== 4)) continue;
        if (IpClass.classifyIp(addr.address) === 'private') return addr.address;
      }
    }
    return null;
  }

  static _interfaces() {
    try {
      return os.networkInterfaces();
    } catch (_) {
      return {};
    }
  }
}

module.exports = RpcBindAddress;
