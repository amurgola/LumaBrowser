class LinkUnwrap {
  static MAX_DEPTH = 6;
  static MAX_LENGTH = 16384;
  static EDGE_SCHEME = /^microsoft-edge:/i;
  static SINGLE_ARGUMENT = /^--single-argument\s+/i;
  static HTTP = /^https?:\/\//i;
  static ENCODED_HTTP = /^https?%3a/i;
  static REDIRECT_PATHS = ['/ck/a', '/aclick', '/aclk'];
  static NEWS_HOSTS = ['msn.com', 'microsoftstart.com'];

  static unwrap(input) {
    let current = LinkUnwrap._clean(input);
    if (!current) return LinkUnwrap._invalid('Empty link');
    if (current.length > LinkUnwrap.MAX_LENGTH) return LinkUnwrap._invalid('Link too long');
    let wrapped = false;
    for (let depth = 0; depth < LinkUnwrap.MAX_DEPTH; depth++) {
      const inner = LinkUnwrap._peelEdge(current);
      if (inner !== null) {
        if (!inner) return LinkUnwrap._invalid('The Edge link carries no target');
        current = inner;
        wrapped = true;
        continue;
      }
      const parsed = LinkUnwrap._parseHttp(current);
      if (!parsed) return LinkUnwrap._invalid('Only http and https links can be opened');
      if (LinkUnwrap._onDomain(parsed.hostname, 'bing.com')) {
        const target = LinkUnwrap._bingRedirectTarget(parsed);
        if (target) {
          current = target;
          wrapped = true;
          continue;
        }
        const query = LinkUnwrap._bingQuery(parsed);
        if (query) return { kind: 'query', query, url: parsed.href, wrapped };
      }
      const news = LinkUnwrap.NEWS_HOSTS.some((d) => LinkUnwrap._onDomain(parsed.hostname, d));
      return { kind: 'url', url: parsed.href, news, wrapped };
    }
    return LinkUnwrap._invalid('Too many nested redirects');
  }

  static isWrapped(input) {
    const text = LinkUnwrap._clean(input);
    if (LinkUnwrap.EDGE_SCHEME.test(text)) return true;
    const parsed = LinkUnwrap._parseHttp(text);
    return !!parsed && LinkUnwrap._onDomain(parsed.hostname, 'bing.com');
  }

  static isHttpUrl(input) {
    return !!LinkUnwrap._parseHttp(LinkUnwrap._clean(input));
  }

  static _clean(input) {
    let text = String(input == null ? '' : input).trim();
    if (text.length >= 2 && text.startsWith('"') && text.endsWith('"')) text = text.slice(1, -1).trim();
    return text.replace(LinkUnwrap.SINGLE_ARGUMENT, '').trim();
  }

  static _peelEdge(text) {
    const cleaned = text.replace(LinkUnwrap.SINGLE_ARGUMENT, '');
    if (!LinkUnwrap.EDGE_SCHEME.test(cleaned)) return null;
    let rest = cleaned.replace(LinkUnwrap.EDGE_SCHEME, '');
    if (rest.startsWith('//?') || rest.startsWith('/?')) rest = rest.slice(rest.indexOf('?'));
    if (rest.startsWith('?')) return LinkUnwrap._param(rest.slice(1), 'url').trim();
    if (LinkUnwrap.ENCODED_HTTP.test(rest)) return LinkUnwrap._decode(rest).trim();
    return rest.trim();
  }

  static _param(query, name) {
    const lower = name.toLowerCase();
    for (const part of String(query).split('#')[0].split('&')) {
      const eq = part.indexOf('=');
      const key = eq < 0 ? part : part.slice(0, eq);
      if (key.toLowerCase() === lower) return LinkUnwrap._decode(eq < 0 ? '' : part.slice(eq + 1));
    }
    return '';
  }

  static _decode(text) {
    try {
      return decodeURIComponent(text);
    } catch (_) {
      return text;
    }
  }

  static _parseHttp(text) {
    if (!LinkUnwrap.HTTP.test(text)) return null;
    try {
      const url = new URL(text);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
      if (!url.hostname) return null;
      return url;
    } catch (_) {
      return null;
    }
  }

  static _onDomain(hostname, domain) {
    const host = String(hostname || '').toLowerCase().replace(/\.$/, '');
    return host === domain || host.endsWith(`.${domain}`);
  }

  static _path(url) {
    return url.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  }

  static _bingRedirectTarget(url) {
    const path = LinkUnwrap._path(url);
    const raw = url.search.slice(1);
    if (path === '/newtabredir') return LinkUnwrap._httpOrNull(LinkUnwrap._param(raw, 'url'));
    if (!LinkUnwrap.REDIRECT_PATHS.includes(path)) return null;
    const u = LinkUnwrap._param(raw, 'u');
    if (/^a1/.test(u)) return LinkUnwrap._httpOrNull(LinkUnwrap._base64Url(u.slice(2)));
    return LinkUnwrap._httpOrNull(u);
  }

  static _httpOrNull(text) {
    const value = String(text || '').trim();
    return LinkUnwrap._parseHttp(value) ? value : null;
  }

  static _base64Url(text) {
    let b64 = String(text).replace(/ /g, '+').replace(/-/g, '+').replace(/_/g, '/');
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(b64)) return '';
    while (b64.length % 4) b64 += '=';
    try {
      return Buffer.from(b64, 'base64').toString('utf8');
    } catch (_) {
      return '';
    }
  }

  static _bingQuery(url) {
    if (!/(^|\/)search$/.test(LinkUnwrap._path(url))) return '';
    return String(url.searchParams.get('q') || '').trim();
  }

  static _invalid(error) {
    return { kind: 'invalid', error };
  }
}

module.exports = LinkUnwrap;
