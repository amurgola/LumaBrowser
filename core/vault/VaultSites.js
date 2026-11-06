const { getDomain } = require('tldts');

class VaultSites {
  static originOf(url) {
    try {
      const u = new URL(String(url || ''));
      if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
      return u.origin;
    } catch (_) {
      return null;
    }
  }

  static hostOf(url) {
    try { return new URL(String(url || '')).hostname || ''; } catch (_) { return ''; }
  }

  static siteOf(url) {
    const host = VaultSites.hostOf(url);
    if (!host) return '';
    return getDomain(host, { allowPrivateDomains: true }) || host;
  }

  static match(savedOrigin, pageUrl) {
    const page = VaultSites.originOf(pageUrl);
    const saved = VaultSites.originOf(savedOrigin);
    if (!page || !saved) return null;
    if (page === saved) return 'exact';
    if (saved.startsWith('https:') && page.startsWith('http:')) return null;
    const site = VaultSites.siteOf(saved);
    return site && site === VaultSites.siteOf(page) ? 'related' : null;
  }

  static normalizeOrigin(value) {
    const text = String(value || '').trim();
    if (!text) return null;
    const direct = VaultSites.originOf(text);
    if (direct) return direct;
    if (/^[a-z][a-z0-9+.-]*:/i.test(text)) return null;
    return VaultSites.originOf(`https://${text}`);
  }
}

module.exports = VaultSites;
