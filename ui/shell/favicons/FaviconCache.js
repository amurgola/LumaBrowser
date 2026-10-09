import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';

export default class FaviconCache {
  constructor({ onHostIcon } = {}) {
    this._icons = new Map();
    this._onHostIcon = onHostIcon || (() => {});
  }

  static host(url) {
    try { return new URL(url).hostname; } catch { return ''; }
  }

  static letter(url, title) {
    return ((title || FaviconCache.host(url) || '').trim()[0] || '').toUpperCase();
  }

  remember(url, icon) {
    const host = FaviconCache.host(url);
    if (!host || !icon || this._icons.get(host) === icon) return;
    this._icons.set(host, icon);
    this._onHostIcon(host);
  }

  store(host, dataUrl) {
    const changed = this._icons.get(host) !== dataUrl;
    this._icons.set(host, dataUrl);
    if (changed) this._onHostIcon(host);
  }

  urlFor(url) {
    const host = FaviconCache.host(url);
    return host ? (this._icons.get(host) || '') : '';
  }

  async prefetch(urls) {
    const api = window.browserDataAPI;
    if (!api || typeof api.getFavicons !== 'function') return false;
    const hosts = [...new Set(urls.map(FaviconCache.host).filter((h) => h && !this._icons.has(h)))];
    if (!hosts.length) return false;
    try {
      return this._mergeFetched(await api.getFavicons(hosts));
    } catch (_) { return false; }
  }

  element(url, title) {
    const src = this.urlFor(url);
    const letter = FaviconCache.letter(url, title) || '?';
    if (!src) return FaviconCache._badge(letter);
    const img = document.createElement('img');
    img.className = 'bookmark-favicon';
    img.src = src;
    img.alt = '';
    img.addEventListener('error', () => {
      if (img.parentNode) img.parentNode.replaceChild(FaviconCache._badge(letter), img);
    });
    return img;
  }

  html(url, title) {
    const letter = HtmlEscaper.escape(FaviconCache.letter(url, title) || '?');
    const fav = this.urlFor(url);
    if (!fav) return `<span class="bookmark-favicon bd-fallback">${letter}</span>`;
    return `<img class="bookmark-favicon" src="${HtmlEscaper.escape(fav)}" data-letter="${letter}" alt="">`;
  }

  _mergeFetched(res) {
    let changed = false;
    if (res && typeof res === 'object') {
      for (const [host, icon] of Object.entries(res)) {
        if (icon && !this._icons.has(host)) { this._icons.set(host, icon); changed = true; }
      }
    }
    return changed;
  }

  static _badge(letter) {
    const span = document.createElement('span');
    span.className = 'bookmark-favicon bd-fallback';
    span.textContent = letter;
    return span;
  }
}
