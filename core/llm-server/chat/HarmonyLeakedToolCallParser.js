class HarmonyLeakedToolCallParser {
  static RECIPIENT = /to=(?:functions\.)?([a-zA-Z0-9_.\-]+)/g;

  static parseAll(content, extractBalancedObject) {
    if (!content || typeof extractBalancedObject !== 'function') return [];
    const text = String(content);
    const calls = [];
    const spans = [];
    for (const match of text.matchAll(HarmonyLeakedToolCallParser.RECIPIENT)) {
      const found = HarmonyLeakedToolCallParser._objectAfter(text, match, spans, extractBalancedObject);
      if (!found) continue;
      spans.push([found.start, found.start + found.source.length]);
      calls.push(HarmonyLeakedToolCallParser._toCall(match[1], found.value));
    }
    return calls;
  }

  static _objectAfter(text, match, spans, extractBalancedObject) {
    const start = text.indexOf('{', match.index + match[0].length);
    if (start === -1 || HarmonyLeakedToolCallParser._isInsideEarlierCall(start, spans)) return null;
    const source = extractBalancedObject(text, start);
    const value = source ? HarmonyLeakedToolCallParser._parse(source) : null;
    return value ? { start, source, value } : null;
  }

  static _isInsideEarlierCall(start, spans) {
    return spans.some(([from, to]) => start > from && start < to);
  }

  static _parse(source) {
    try {
      const value = JSON.parse(source);
      return value && typeof value === 'object' ? value : null;
    } catch (_) {
      return null;
    }
  }

  static _toCall(recipient, value) {
    if (typeof value.tool === 'string' && value.params && typeof value.params === 'object') {
      return { tool: value.tool, params: value.params };
    }
    return { tool: recipient.replace(/^functions\./, ''), params: value };
  }
}

module.exports = HarmonyLeakedToolCallParser;
