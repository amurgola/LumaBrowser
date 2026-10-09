import HtmlEscaper from '../format/HtmlEscaper.js';

export default class ReadmeInline {
  constructor(vault) {
    this._vault = vault;
  }

  static stripTags(value) {
    return String(value == null ? '' : value).replace(/<[^>]+>/g, '');
  }

  render(raw) {
    let text = String(raw == null ? '' : raw);
    text = this._vaultHtmlLinks(text);
    text = ReadmeInline._emphasisTagsToMarkdown(text);
    text = HtmlEscaper.escapeKeepingApostrophes(text);
    return ReadmeInline._markdown(text);
  }

  _vaultHtmlLinks(text) {
    const esc = HtmlEscaper.escapeKeepingApostrophes;
    return text.replace(/<a\b[^>]*?\bhref\s*=\s*["']?([^"'>\s]+)["']?[^>]*>([\s\S]*?)<\/a>/gi, (_m, url, inner) => {
      const label = esc(ReadmeInline.stripTags(inner).replace(/\s+/g, ' ').trim()) || esc(url);
      return /^https?:/i.test(url)
        ? this._vault.stash(`<span class="ms-link" data-href="${esc(url)}">${label}</span>`)
        : label;
    });
  }

  static _emphasisTagsToMarkdown(text) {
    return text.replace(/<\/?(?:b|strong)\b[^>]*>/gi, '**')
      .replace(/<\/?(?:i|em)\b[^>]*>/gi, '*')
      .replace(/<\/?(?:code|kbd|tt)\b[^>]*>/gi, '`');
  }

  static _markdown(escaped) {
    return escaped
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, (_m, alt) => alt || '')
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, (_m, label, url) => `<span class="ms-link" data-href="${url}">${label}</span>`)
      .replace(/`([^`]+)`/g, (_m, code) => `<code>${code}</code>`)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      .replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>');
  }
}
