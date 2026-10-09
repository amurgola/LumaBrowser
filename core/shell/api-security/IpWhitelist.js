const net = require('net');
const IpClass = require('../../shared/net/IpClass');

class IpWhitelist {
  constructor(entries = []) {
    this._blockList = new net.BlockList();
    for (const raw of entries) this._add(String(raw || '').trim());
  }

  static isValidEntry(entry) {
    return IpWhitelist._parse(entry) !== null;
  }

  matches(ip) {
    const family = IpWhitelist._family(ip);
    if (!family) return false;
    try {
      return this._blockList.check(ip, family);
    } catch {
      return false;
    }
  }

  _add(entry) {
    const parsed = IpWhitelist._parse(entry);
    if (!parsed) return;
    try {
      if (parsed.prefix === null) this._blockList.addAddress(parsed.addr, parsed.family);
      else this._blockList.addSubnet(parsed.addr, parsed.prefix, parsed.family);
    } catch {}
  }

  static _parse(entry) {
    if (!entry) return null;
    if (!entry.includes('/')) return IpWhitelist._parseAddress(entry);
    return IpWhitelist._parseSubnet(entry);
  }

  static _parseAddress(entry) {
    const addr = IpClass.normalizeIp(entry);
    const family = IpWhitelist._family(addr);
    return family ? { addr, family, prefix: null } : null;
  }

  static _parseSubnet(entry) {
    const [rawAddr, prefixStr] = entry.split('/');
    const addr = IpClass.normalizeIp(rawAddr);
    const prefix = parseInt(prefixStr, 10);
    const family = IpWhitelist._family(addr);
    if (!family || Number.isNaN(prefix)) return null;
    const maxPrefix = family === 'ipv6' ? 128 : 32;
    if (prefix < 0 || prefix > maxPrefix) return null;
    return { addr, family, prefix };
  }

  static _family(ip) {
    if (!ip) return null;
    const version = net.isIP(ip);
    if (version === 4) return 'ipv4';
    if (version === 6) return 'ipv6';
    return null;
  }
}

module.exports = IpWhitelist;
