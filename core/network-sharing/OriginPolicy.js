const IpClass = require('../shared/net/IpClass');

class OriginPolicy {
  static MODE_ANY = 'any';
  static MODE_LAN = 'lan';

  static originAllowed(bindMode, req) {
    if (bindMode === OriginPolicy.MODE_ANY) return true;
    return IpClass.isLanPeer(IpClass.clientIp(req));
  }
}

module.exports = OriginPolicy;
