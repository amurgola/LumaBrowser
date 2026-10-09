class UrlResolver {
  static FETCHABLE_PROTOCOLS = new Set(['http:', 'https:']);

  static forDocument(pageUrl, baseHref) {
    const page = UrlResolver._absolute(pageUrl, null);
    const base = baseHref ? UrlResolver._absolute(baseHref, page) : null;
    return new UrlResolver(base || page);
  }

  constructor(baseUrl) {
    this._base = baseUrl || null;
  }

  resolve(href) {
    const trimmed = String(href || '').trim();
    if (!trimmed || trimmed.startsWith('#')) return null;
    return UrlResolver._absolute(trimmed, this._base);
  }

  static _absolute(href, base) {
    if (!href) return null;
    const own = UrlResolver._parse(href);
    if (own) return UrlResolver._fetchable(own) ? href : null;
    const resolved = base ? UrlResolver._parse(href, base) : null;
    return resolved && UrlResolver._fetchable(resolved) ? resolved.href : null;
  }

  static _parse(href, base) {
    try { return new URL(href, base); } catch (_) { return null; }
  }

  static _fetchable(url) {
    return UrlResolver.FETCHABLE_PROTOCOLS.has(url.protocol);
  }
}

module.exports = UrlResolver;
