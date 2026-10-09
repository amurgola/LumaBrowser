const crypto = require('crypto');

class SapisidHash {
  static COOKIE_NAMES = ['SAPISID', '__Secure-3PAPISID'];

  static sapisidOf(cookies) {
    for (const name of SapisidHash.COOKIE_NAMES) {
      const hit = (cookies || []).find((c) => c && c.name === name && c.value);
      if (hit) return String(hit.value);
    }
    return null;
  }

  static header(sapisid, origin, nowMs = Date.now()) {
    const seconds = Math.floor(nowMs / 1000);
    const digest = crypto.createHash('sha1').update(`${seconds} ${sapisid} ${origin}`).digest('hex');
    return `SAPISIDHASH ${seconds}_${digest}`;
  }

  static cookieHeader(cookies, host = null) {
    const byName = new Map();
    for (const c of cookies || []) {
      if (!c || !c.name) continue;
      if (host && !SapisidHash._applies(c.domain, host)) continue;
      if (!byName.has(c.name)) byName.set(c.name, c.value);
    }
    return [...byName].map(([name, value]) => `${name}=${value}`).join('; ');
  }

  static _applies(cookieDomain, host) {
    if (!cookieDomain) return true;
    const domain = String(cookieDomain).toLowerCase().replace(/^\./, '');
    const h = String(host).toLowerCase();
    return h === domain || h.endsWith(`.${domain}`);
  }
}

module.exports = SapisidHash;
