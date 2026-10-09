class CappedJson {
  static WRAPPER_CHARS = 200;

  static stringify(value, maxChars) {
    const json = CappedJson._json(value);
    if (json == null) return null;
    if (json.length <= maxChars) return json;
    return JSON.stringify({ _truncated: true, _originalChars: json.length, text: json.slice(0, maxChars - CappedJson.WRAPPER_CHARS) });
  }

  static _json(value) {
    try {
      return JSON.stringify(value);
    } catch (_) {
      return JSON.stringify(String(value));
    }
  }
}

module.exports = CappedJson;
