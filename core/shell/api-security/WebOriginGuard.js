const net = require('net');
const os = require('os');
const LoopbackRequestGuard = require('../../shared/net/LoopbackRequestGuard');

class WebOriginGuard {
  static HOST_REFUSED = 'Host not allowed without an API key: call this API by IP address, localhost or this computer\'s name';

  static ORIGIN_REFUSED = 'Web pages on other origins need an API key to call this API';

  static OWN_SITES = ['same-origin', 'none'];

  static LOCAL_SUFFIXES = ['.local', '.localhost'];

  static WEB_SCHEMES = ['http:', 'https:'];

  static refusal(req, { allowNavigation = false, hostname = os.hostname() } = {}) {
    const headers = (req && req.headers) || {};
    if (!WebOriginGuard._hostAllowed(headers.host, hostname)) return WebOriginGuard.HOST_REFUSED;
    if (allowNavigation && WebOriginGuard._isPageNavigation(req, headers)) return null;
    if (!WebOriginGuard._originIsOwn(headers.origin, headers.host)) return WebOriginGuard.ORIGIN_REFUSED;
    if (!WebOriginGuard._siteIsOwn(headers['sec-fetch-site'])) return WebOriginGuard.ORIGIN_REFUSED;
    return null;
  }

  static _hostAllowed(header, hostname) {
    const name = LoopbackRequestGuard.hostnameOf(header);
    if (name === null) return false;
    if (LoopbackRequestGuard.LOOPBACK_NAMES.includes(name) || net.isIP(name) !== 0) return true;
    if (!name.includes('.')) return true;
    if (WebOriginGuard.LOCAL_SUFFIXES.some((suffix) => name.endsWith(suffix))) return true;
    return name === String(hostname || '').toLowerCase();
  }

  static _isPageNavigation(req, headers) {
    return String(req.method || '').toUpperCase() === 'GET'
      && headers['sec-fetch-mode'] === 'navigate'
      && headers['sec-fetch-dest'] === 'document';
  }

  static _originIsOwn(origin, hostHeader) {
    if (origin === undefined) return true;
    const parsed = WebOriginGuard._parse(origin);
    if (!parsed || !WebOriginGuard.WEB_SCHEMES.includes(parsed.protocol)) return false;
    return parsed.host === String(hostHeader || '').toLowerCase();
  }

  static _siteIsOwn(site) {
    return site === undefined || WebOriginGuard.OWN_SITES.includes(String(site).toLowerCase());
  }

  static _parse(origin) {
    try { return new URL(String(origin)); } catch (_) { return null; }
  }
}

module.exports = WebOriginGuard;
