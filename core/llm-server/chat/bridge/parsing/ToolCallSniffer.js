const XmlToolCallParser = require('./XmlToolCallParser');

class ToolCallSniffer {
  static TARGET_KEYS = ['path', 'file_path', 'file', 'url', 'glob', 'pattern', 'query', 'title', 'selector'];
  static TARGET_MAX = 120;
  static KNOWN_CALL = /"tool"\s*:\s*"(?:create_artifact|create_live_artifact|generate_image|edit_image|generate_video|animate_image|generate_music|navigate|click|type|observe_page|fill_form|get_source|extract_data|screenshot)"/i;

  static toolName(buf) {
    const m = /"(?:tool|name)"\s*:\s*"([a-zA-Z0-9_]+)"/.exec(buf);
    if (m) return m[1];
    const x = XmlToolCallParser.FN_NAME.exec(buf);
    return (x && x[1] !== XmlToolCallParser.PLACEHOLDER_NAME) ? x[1] : null;
  }

  static target(buf) {
    for (const key of ToolCallSniffer.TARGET_KEYS) {
      const json = ToolCallSniffer._jsonValue(buf, key);
      if (json != null) return json;
      const xml = ToolCallSniffer._xmlValue(buf, key);
      if (xml != null) return xml;
    }
    return null;
  }

  static attemptedToolName(content) {
    if (!content) return null;
    const m = String(content).match(/"tool"\s*:\s*"([a-zA-Z0-9_]+)"/);
    return m ? m[1] : ToolCallSniffer.toolName(String(content));
  }

  static looksLikeAttempt(content) {
    if (!content) return false;
    const s = String(content);
    if (/```\s*tool\b/i.test(s)) return true;
    if (XmlToolCallParser.OPEN.test(s)) return true;
    return ToolCallSniffer.KNOWN_CALL.test(s);
  }

  static _jsonValue(buf, key) {
    const j = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.){1,${ToolCallSniffer.TARGET_MAX}})"`).exec(buf);
    if (!j) return null;
    try { return JSON.parse(`"${j[1]}"`); } catch (_) { return j[1]; }
  }

  static _xmlValue(buf, key) {
    const x = new RegExp(`<parameter\\s*(?:=\\s*|name\\s*=\\s*)["']?${key}["']?\\s*>([\\s\\S]{1,${ToolCallSniffer.TARGET_MAX}}?)</parameter>`, 'i').exec(buf);
    return x ? x[1].trim() : null;
  }
}

module.exports = ToolCallSniffer;
