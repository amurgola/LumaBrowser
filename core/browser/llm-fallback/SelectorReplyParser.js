class SelectorReplyParser {
  static MAX_LENGTH = 500;

  static parse(text) {
    if (!text) return null;
    const cleaned = SelectorReplyParser._firstLine(SelectorReplyParser._unquote(SelectorReplyParser._stripFences(text)));
    if (!cleaned || cleaned.length > SelectorReplyParser.MAX_LENGTH) return null;
    return cleaned;
  }

  static _stripFences(text) {
    return text.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
  }

  static _unquote(text) {
    const quoted = (text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"));
    return quoted ? text.slice(1, -1).trim() : text;
  }

  static _firstLine(text) {
    return text.split('\n')[0].trim();
  }
}

module.exports = SelectorReplyParser;
