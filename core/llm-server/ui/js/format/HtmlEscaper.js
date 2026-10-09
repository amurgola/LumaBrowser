export default class HtmlEscaper {
  static escape(value) {
    return HtmlEscaper._text(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  static escapeKeepingApostrophes(value) {
    return HtmlEscaper._text(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  static escapeText(value) {
    return HtmlEscaper._text(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  static _text(value) {
    return String(value == null ? '' : value);
  }
}
