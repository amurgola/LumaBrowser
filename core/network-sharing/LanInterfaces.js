const os = require('os');

class LanInterfaces {
  static ipv4Addresses() {
    try {
      return Object.values(os.networkInterfaces())
        .map((addresses) => (addresses || []).find((addr) => LanInterfaces._isLanIpv4(addr)))
        .filter(Boolean)
        .map((addr) => addr.address);
    } catch (_) {
      return [];
    }
  }

  static addressKey() {
    return LanInterfaces.ipv4Addresses().sort().join(',');
  }

  static _isLanIpv4(addr) {
    if (addr.internal) return false;
    return addr.family === 'IPv4' || addr.family === 4;
  }
}

module.exports = LanInterfaces;
