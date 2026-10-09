class StringPreview {
  static MAX_CHARS = 48;
  static CONTINUES = '…';

  static quote(text, maxChars = StringPreview.MAX_CHARS) {
    if (text.length <= maxChars) return JSON.stringify(text);
    return JSON.stringify(StringPreview._head(text, maxChars)) + StringPreview.CONTINUES;
  }

  static _head(text, maxChars) {
    const code = text.charCodeAt(maxChars - 1);
    const splitsPair = code >= 0xD800 && code <= 0xDBFF;
    return text.slice(0, splitsPair ? maxChars - 1 : maxChars);
  }
}

module.exports = StringPreview;
