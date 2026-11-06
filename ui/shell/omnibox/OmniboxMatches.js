export default class OmniboxMatches {
  static BOOKMARK_LIMIT = 3;

  static TAB_LIMIT = 2;

  static terms(query) {
    return String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
  }

  static bare(url) {
    return String(url || '').toLowerCase().replace(/^[a-z][a-z0-9+.-]*:\/\//, '').replace(/^www\./, '');
  }

  static score(terms, url, title) {
    if (!terms.length) return 0;
    const address = OmniboxMatches.bare(url);
    const name = String(title || '').toLowerCase();
    if (!terms.every((t) => address.includes(t) || name.includes(t))) return 0;
    const first = terms[0];
    if (address.startsWith(first)) return 3;
    if (name.startsWith(first) || name.includes(` ${first}`)) return 2;
    return 1;
  }

  static _ranked(candidates, terms, limit) {
    return candidates
      .map((c, i) => ({ c, i, s: OmniboxMatches.score(terms, c.url, c.title) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s || a.i - b.i)
      .slice(0, limit)
      .map((r) => r.c);
  }

  static bookmarks(nodes, query, limit = OmniboxMatches.BOOKMARK_LIMIT) {
    const flat = [];
    const walk = (list) => {
      for (const n of list || []) {
        if (n.type === 'folder') walk(n.children);
        else if (n.url && /^https?:\/\//i.test(n.url)) flat.push({ url: n.url, title: n.title || '' });
      }
    };
    walk(nodes);
    return OmniboxMatches._ranked(flat, OmniboxMatches.terms(query), limit);
  }

  static openTabs(tabs, activeId, query, limit = OmniboxMatches.TAB_LIMIT) {
    const list = [];
    for (const t of tabs || []) {
      if (!t || t.id === activeId || t.silent || t.hidden || (t.kind && t.kind !== 'user')) continue;
      if (!/^https?:\/\//i.test(t.url || '')) continue;
      list.push({ id: t.id, url: t.url, title: t.title || '' });
    }
    return OmniboxMatches._ranked(list, OmniboxMatches.terms(query), limit);
  }
}
