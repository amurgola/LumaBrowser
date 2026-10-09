const BalancedJson = require('../../shared/llm/BalancedJson');
const ToolCallNormalizer = require('./ToolCallNormalizer');

class ToolFenceParser {
  static FENCE_OPENER = /```tool[ \t]*\r?\n?/g;
  static ILLEGAL_ESCAPE = /\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g;

  static parseAll(content) {
    if (!content) return [];
    const calls = [];
    const opener = new RegExp(ToolFenceParser.FENCE_OPENER);
    let match;
    while ((match = opener.exec(content)) !== null) {
      const found = ToolFenceParser._callAfter(content, match.index + match[0].length);
      if (!found) continue;
      if (found.call) calls.push(found.call);
      opener.lastIndex = found.end;
    }
    return calls;
  }

  static parseFirst(content) {
    const calls = ToolFenceParser.parseAll(content);
    return calls.length ? calls[0] : null;
  }

  static fixIllegalJsonEscapes(text) {
    return String(text).replace(ToolFenceParser.ILLEGAL_ESCAPE, '\\\\');
  }

  static _callAfter(content, from) {
    const brace = content.indexOf('{', from);
    if (brace === -1) return null;
    const body = BalancedJson.extractObject(content, brace);
    if (!body) return null;
    return { call: ToolFenceParser._toCall(body), end: brace + body.length };
  }

  static _toCall(body) {
    const { parsed, escapeFixed } = ToolFenceParser._parseBody(body);
    const call = ToolCallNormalizer.normalize(parsed);
    if (call && escapeFixed && !call.__coerced) call.__coerced = 'illegal-escape';
    return call;
  }

  static _parseBody(body) {
    try {
      return { parsed: JSON.parse(body), escapeFixed: false };
    } catch (_) {
      return ToolFenceParser._parseWithFixedEscapes(body);
    }
  }

  static _parseWithFixedEscapes(body) {
    try {
      return { parsed: JSON.parse(ToolFenceParser.fixIllegalJsonEscapes(body)), escapeFixed: true };
    } catch (_) {
      return { parsed: null, escapeFixed: false };
    }
  }
}

module.exports = ToolFenceParser;
