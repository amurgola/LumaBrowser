class JsonColumn {
  static parse(text, fallback) {
    if (arguments.length < 2) throw new Error('JsonColumn.parse: an explicit fallback is required');
    try {
      return JSON.parse(text);
    } catch (_) {
      return typeof fallback === 'function' ? fallback(text) : fallback;
    }
  }
}

module.exports = JsonColumn;
