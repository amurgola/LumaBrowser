const CoreRequire = require('../CoreRequire');

const BalancedJson = CoreRequire.load('shared/llm/BalancedJson');

class AiReplyParser {
  static TEXT_KEYS = new Set(['text', 'response', 'reply', 'answer', 'message', 'say', 'dialogue', 'speech', 'content', 'final', 'output']);

  static clean(text) {
    return String(text == null ? '' : text)
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/<\|channel\|>[\s\S]*?<\|message\|>/g, '')
      .replace(/```(?:json|javascript|js)?\s*/gi, '')
      .replace(/```/g, '')
      .trim();
  }

  static firstJsonObject(text) {
    const s = AiReplyParser.clean(text);
    let from = 0;
    while (from < s.length) {
      const start = s.indexOf('{', from);
      if (start < 0) return null;
      const parsed = AiReplyParser._parseAt(s, start);
      if (parsed !== undefined) return parsed;
      from = start + 1;
    }
    return null;
  }

  static parse(raw, { tools = [], json = false } = {}) {
    const hasTools = Array.isArray(tools) && tools.length > 0;
    const obj = (hasTools || json) ? AiReplyParser.firstJsonObject(raw) : null;
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      const structured = AiReplyParser._structured(obj, raw, tools, hasTools, json);
      if (structured) return structured;
    }
    if (json) return { kind: 'invalid', raw, reason: 'no JSON object in reply' };
    return { kind: 'final', text: AiReplyParser.unwrapTextObject(AiReplyParser.clean(raw)) };
  }

  static unwrapTextObject(text) {
    const s = String(text || '').trim();
    if (!s.startsWith('{') || !s.endsWith('}')) return s;
    let obj = null;
    try { obj = JSON.parse(s); } catch (_) { return s; }
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return s;
    const keys = Object.keys(obj);
    if (keys.length === 1 && typeof obj[keys[0]] === 'string') return obj[keys[0]].trim();
    const textKey = keys.find((k) => AiReplyParser.TEXT_KEYS.has(k.toLowerCase()) && typeof obj[k] === 'string');
    if (textKey && keys.every((k) => k === textKey || typeof obj[k] !== 'object')) return obj[textKey].trim();
    return s;
  }

  static _parseAt(s, start) {
    const slice = BalancedJson.extractObject(s, start);
    if (!slice) return undefined;
    try { return JSON.parse(slice); } catch (_) { return undefined; }
  }

  static _structured(obj, raw, tools, hasTools, json) {
    if (hasTools && typeof obj.tool === 'string') return AiReplyParser._toolCall(obj, raw, tools);
    if (Object.prototype.hasOwnProperty.call(obj, 'final')) return AiReplyParser._final(obj.final, raw, json);
    if (json) return { kind: 'final', text: JSON.stringify(obj), value: obj };
    return null;
  }

  static _toolCall(obj, raw, tools) {
    const name = obj.tool.trim();
    if (!tools.find((t) => t.name === name)) return { kind: 'invalid', raw, reason: `unknown tool "${name}"` };
    return { kind: 'tool', name, args: AiReplyParser._args(obj), raw };
  }

  static _args(obj) {
    if (obj.args && typeof obj.args === 'object') return obj.args;
    if (obj.arguments && typeof obj.arguments === 'object') return obj.arguments;
    return {};
  }

  static _final(fin, raw, json) {
    if (!json) return { kind: 'final', text: typeof fin === 'string' ? AiReplyParser.unwrapTextObject(fin) : JSON.stringify(fin) };
    if (fin && typeof fin === 'object') return { kind: 'final', text: JSON.stringify(fin), value: fin };
    const inner = typeof fin === 'string' ? AiReplyParser.firstJsonObject(fin) : null;
    if (inner) return { kind: 'final', text: JSON.stringify(inner), value: inner };
    return { kind: 'invalid', raw, reason: 'final was not a JSON object' };
  }
}

module.exports = AiReplyParser;
