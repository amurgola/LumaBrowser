const net = require('net');
const os = require('os');
const TabUrl = require('../../../../browser/TabUrl');
const IpClass = require('../../../../shared/net/IpClass');

class GuestTargetGuard {
  static URL_REFUSED = 'That address is on the host computer itself (a local file, an internal page or a local service) and is not available to a shared chat.';

  static TAB_REFUSED = 'That tab is showing something private to the host computer and is not available to a shared chat.';

  static WEB_SCHEMES = ['http:', 'https:'];

  static HARMLESS_SCHEMES = ['about:'];

  static LOCAL_NAMES = ['localhost'];

  static LOCAL_SUFFIXES = ['.localhost'];

  static UNSPECIFIED_ADDRESSES = ['0.0.0.0', '::'];

  static async refusal(params, browserService, host = GuestTargetGuard._thisComputer()) {
    const call = params || {};
    if (typeof call.url === 'string' && GuestTargetGuard.isHostPrivate(call.url, host)) return GuestTargetGuard.URL_REFUSED;
    const tabUrl = await GuestTargetGuard._tabUrl(call.tabId, browserService);
    if (tabUrl && GuestTargetGuard.isHostPrivate(tabUrl, host)) return GuestTargetGuard.TAB_REFUSED;
    return null;
  }

  static isHostPrivate(url, host = GuestTargetGuard._thisComputer()) {
    const parsed = GuestTargetGuard._parse(TabUrl.normalize(String(url).trim()));
    if (!parsed) return false;
    if (GuestTargetGuard.HARMLESS_SCHEMES.includes(parsed.protocol)) return false;
    if (!GuestTargetGuard.WEB_SCHEMES.includes(parsed.protocol)) return true;
    return GuestTargetGuard._isThisComputer(GuestTargetGuard._hostname(parsed), host);
  }

  static _isThisComputer(name, host) {
    if (GuestTargetGuard.LOCAL_NAMES.includes(name)) return true;
    if (GuestTargetGuard.LOCAL_SUFFIXES.some((suffix) => name.endsWith(suffix))) return true;
    if (net.isIP(name) !== 0) return GuestTargetGuard._isOwnAddress(name, host);
    return host.names.includes(name);
  }

  static _isOwnAddress(address, host) {
    return IpClass.isLoopbackIp(address)
      || GuestTargetGuard.UNSPECIFIED_ADDRESSES.includes(address)
      || host.addresses.includes(address);
  }

  static async _tabUrl(tabId, browserService) {
    if (tabId == null || !browserService || typeof browserService.getTabs !== 'function') return null;
    try {
      const listed = await browserService.getTabs({ includeSilent: true });
      const tab = ((listed && listed.tabs) || []).find((each) => String(each.id) === String(tabId));
      return tab && typeof tab.url === 'string' ? tab.url : null;
    } catch (_) {
      return null;
    }
  }

  static _thisComputer() {
    const name = String(os.hostname() || '').toLowerCase();
    const addresses = Object.values(os.networkInterfaces()).flat().filter(Boolean).map((each) => String(each.address).toLowerCase());
    return { names: name ? [name, `${name}.local`] : [], addresses };
  }

  static _hostname(parsed) {
    return parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  }

  static _parse(url) {
    try { return new URL(url); } catch (_) { return null; }
  }
}

module.exports = GuestTargetGuard;
