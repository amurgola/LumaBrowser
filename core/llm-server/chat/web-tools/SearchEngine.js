const HtmlEntityDecoder = require('../../../shared/content/HtmlEntityDecoder');

class SearchEngine {
  static RESULT_LIMIT = 6;

  static searchUrl(_query) {
    throw new Error(`${this.name}.searchUrl is not implemented`);
  }

  static parse(_html, _limit = SearchEngine.RESULT_LIMIT) {
    throw new Error(`${this.name}.parse is not implemented`);
  }

  static stripTags(html) {
    return HtmlEntityDecoder.decode(String(html || '').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
  }

  static _attr(attrs, name) {
    const match = new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'i').exec(attrs || '');
    return match ? match[1] : '';
  }

  static _isHttp(url) {
    return /^https?:/i.test(url);
  }

  static _isOnDomain(url, domain) {
    try {
      const host = new URL(url).hostname.toLowerCase();
      return host === domain || host.endsWith(`.${domain}`);
    } catch (_) {
      return true;
    }
  }
}

module.exports = SearchEngine;
