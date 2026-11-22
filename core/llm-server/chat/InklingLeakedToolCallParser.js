const BalancedJson = require('../../shared/llm/BalancedJson');

class InklingLeakedToolCallParser {
  static MARKER = '<|content_invoke_tool_json|>';

  static parseAll(content) {
    return InklingLeakedToolCallParser._blocks(String(content || '')).map((block) => block.call);
  }

  static trailing(reasoning) {
    const text = String(reasoning || '');
    const blocks = InklingLeakedToolCallParser._blocks(text);
    const last = blocks[blocks.length - 1];
    if (!last || text.slice(last.end).trim()) return '';
    return text.slice(last.start, last.end);
  }

  static _blocks(text) {
    const blocks = [];
    let from = 0;
    for (let at = text.indexOf(InklingLeakedToolCallParser.MARKER, from); at !== -1; at = text.indexOf(InklingLeakedToolCallParser.MARKER, from)) {
      const block = InklingLeakedToolCallParser._blockAt(text, at);
      if (block) blocks.push(block);
      from = block ? block.end : at + InklingLeakedToolCallParser.MARKER.length;
    }
    return blocks;
  }

  static _blockAt(text, markerAt) {
    const afterMarker = markerAt + InklingLeakedToolCallParser.MARKER.length;
    const leadingSpace = text.slice(afterMarker).search(/\S/);
    const braceAt = afterMarker + Math.max(leadingSpace, 0);
    if (text[braceAt] !== '{') return null;
    const source = BalancedJson.extractObject(text, braceAt);
    const call = source ? InklingLeakedToolCallParser._toCall(source) : null;
    return call ? { start: markerAt, end: braceAt + source.length, call } : null;
  }

  static _toCall(source) {
    try {
      const value = JSON.parse(source);
      const args = value && value.args;
      if (!value || typeof value.name !== 'string' || !value.name.trim()) return null;
      if (!args || typeof args !== 'object' || Array.isArray(args)) return null;
      return { tool: value.name.trim(), params: args };
    } catch (_) {
      return null;
    }
  }
}

module.exports = InklingLeakedToolCallParser;
