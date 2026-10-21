class MatchPattern {
  static ALL_URLS = '<all_urls>';
  static SCHEMES = ['http', 'https', 'file', 'ftp', 'ws', 'wss'];

  static anyMatch(patterns, url) {
    if (!Array.isArray(patterns) || !patterns.length) return true;
    return patterns.some((pattern) => MatchPattern.matches(pattern, url));
  }

  static matches(pattern, url) {
    let parsed;
    try { parsed = new URL(url); } catch (_) { return false; }
    const scheme = parsed.protocol.replace(/:$/, '');
    if (pattern === MatchPattern.ALL_URLS) return MatchPattern.SCHEMES.includes(scheme);
    const m = /^(\*|[a-z][a-z0-9+.-]*):\/\/([^/]*)(\/.*)?$/i.exec(String(pattern || ''));
    if (!m) return false;
    const [, patScheme, patHost, patPath = '/*'] = m;
    if (patScheme === '*' ? !['http', 'https'].includes(scheme) : patScheme.toLowerCase() !== scheme) return false;
    if (!MatchPattern._hostMatches(patHost.toLowerCase(), parsed.hostname.toLowerCase())) return false;
    return MatchPattern._globMatches(patPath, `${parsed.pathname}${parsed.search}`);
  }

  static _hostMatches(patHost, host) {
    if (patHost === '*' || patHost === '') return true;
    if (patHost.startsWith('*.')) {
      const base = patHost.slice(2);
      return host === base || host.endsWith(`.${base}`);
    }
    return patHost === host;
  }

  static _globMatches(glob, text) {
    const re = new RegExp(`^${glob.split('*').map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`);
    return re.test(text);
  }
}

module.exports = MatchPattern;
