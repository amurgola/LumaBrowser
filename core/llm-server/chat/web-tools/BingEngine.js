const HtmlEntityDecoder = require('../../../shared/content/HtmlEntityDecoder');
const SearchEngine = require('./SearchEngine');

class BingEngine extends SearchEngine {
  static RESULTS_URL = 'https://www.bing.com/search';

  static searchUrl(query) {
    return `${BingEngine.RESULTS_URL}?q=${encodeURIComponent(query)}`;
  }

  static parse(html, limit = SearchEngine.RESULT_LIMIT) {
    const results = [];
    for (const block of String(html || '').split(/<li class="b_algo"/i).slice(1)) {
      if (results.length >= limit) break;
      const row = BingEngine._resultRow(block);
      if (row) results.push(row);
    }
    return results;
  }

  static decodeHref(href) {
    const match = /[?&]u=a1([^&]+)/.exec(String(href || ''));
    if (match) {
      const decoded = BingEngine._base64Url(match[1]);
      if (SearchEngine._isHttp(decoded)) return decoded;
    }
    return String(href || '');
  }

  static _resultRow(block) {
    const anchor = /<h2[^>]*>\s*<a\b([^>]*)>([\s\S]*?)<\/a>/i.exec(block);
    if (!anchor) return null;
    const url = BingEngine._resultUrl(anchor[1]);
    const title = SearchEngine.stripTags(anchor[2]);
    if (!title || !SearchEngine._isHttp(url) || SearchEngine._isOnDomain(url, 'bing.com')) return null;
    const paragraph = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(block);
    return { title, url, snippet: paragraph ? SearchEngine.stripTags(paragraph[1]) : '' };
  }

  static _resultUrl(attrs) {
    let url = HtmlEntityDecoder.decode(SearchEngine._attr(attrs, 'href'));
    if (url.startsWith('/')) url = `https://www.bing.com${url}`;
    return BingEngine.decodeHref(url);
  }

  static _base64Url(text) {
    let b64 = text.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    return Buffer.from(b64, 'base64').toString('utf8');
  }
}

module.exports = BingEngine;
