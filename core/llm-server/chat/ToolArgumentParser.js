class ToolArgumentParser {
  static ILLEGAL_ESCAPE = /\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g;

  static parse(raw) {
    const text = String(raw == null ? '' : raw).trim();
    if (!text) return {};
    return ToolArgumentParser._parseObject(text)
      || ToolArgumentParser._parseObject(ToolArgumentParser._doubleIllegalEscapes(text));
  }

  static _doubleIllegalEscapes(text) {
    const bs = String.fromCharCode(92);
    return text.replace(ToolArgumentParser.ILLEGAL_ESCAPE, bs + bs);
  }

  static _parseObject(text) {
    try {
      const value = JSON.parse(text);
      return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = ToolArgumentParser;
