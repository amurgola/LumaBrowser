const HtmlEntityDecoder = require('../../../shared/content/HtmlEntityDecoder');
const SearchEngine = require('./SearchEngine');

class DuckDuckGoEngine extends SearchEngine {
  static RESULTS_URL = 'https://html.duckduckgo.com/html/';
  static TAB_NEEDLE = 'result__a';

  static searchUrl(query) {
    return `${DuckDuckGoEngine.RESULTS_URL}?q=${encodeURIComponent(query)}`;
  }

  static parse(html, limit = SearchEngine.RESULT_LIMIT) {
    const results = [];
    const page = String(html || '');
    const anchorRe = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = anchorRe.exec(page)) !== null) {
      const cls = SearchEngine._attr(match[1], 'class');
      if (/\bresult__a\b/.test(cls)) {
        if (results.length >= limit) break;
        const row = DuckDuckGoEngine._resultRow(match[1], match[2]);
        if (row) results.push(row);
      } else if (/\bresult__snippet\b/.test(cls)) {
        DuckDuckGoEngine._attachSnippet(results, match[2]);
      }
    }
    return results;
  }

  static unwrapHref(href) {
    if (!href) return '';
    const absolute = href.startsWith('//') ? `https:${href}` : href;
    const match = /[?&]uddg=([^&]+)/.exec(absolute);
    if (match) {
      try {
        return decodeURIComponent(match[1]);
      } catch (_) {}
    }
    return absolute;
  }

  static _resultRow(attrs, inner) {
    const url = DuckDuckGoEngine.unwrapHref(HtmlEntityDecoder.decode(SearchEngine._attr(attrs, 'href')));
    const title = SearchEngine.stripTags(inner);
    if (!title || !SearchEngine._isHttp(url) || SearchEngine._isOnDomain(url, 'duckduckgo.com')) return null;
    return { title, url, snippet: '' };
  }

  static _attachSnippet(results, inner) {
    const last = results[results.length - 1];
    if (last && !last.snippet) last.snippet = SearchEngine.stripTags(inner);
  }
}

module.exports = DuckDuckGoEngine;
