class ToolFenceStripper {
  static stripDebris(text) {
    return String(text || '')
      .replace(/```tool[\s\S]*?(?:```|$)/g, '')
      .replace(/<tool_call>[\s\S]*?(?:<\/tool_call>|$)/gi, '')
      .replace(/<function\s*(?:=|name\s*=)[\s\S]*?(?:<\/function>|$)/gi, '')
      .replace(/[`\s]+$/, '');
  }

  static stripLeaked(text) {
    if (!text) return { text: text || '', removed: 0 };
    const state = { s: String(text), removed: 0 };
    ToolFenceStripper._stripFences(state);
    ToolFenceStripper._stripXml(state, /<tool_call>[\s\S]*?(?:<\/tool_call>|$)/gi);
    ToolFenceStripper._stripXml(state, /<function\s*(?:=|\s+name\s*=)[\s\S]*?(?:<\/function>|$)/gi);
    return { text: state.s.trim(), removed: state.removed };
  }

  static _stripFences(state) {
    const drop = (m, body) => {
      if (!ToolFenceStripper._isCallBody(body)) return m;
      state.removed++;
      return '';
    };
    state.s = state.s.replace(/```[ \t]*[a-zA-Z]*[ \t]*\n?([\s\S]*?)```/g, drop);
    state.s = state.s.replace(/```[ \t]*[a-zA-Z]*[ \t]*\n([\s\S]*)$/, drop);
  }

  static _stripXml(state, re) {
    state.s = state.s.replace(re, (m) => {
      if (!/\{|<parameter/.test(m)) return m;
      state.removed++;
      return '';
    });
  }

  static _isCallBody(body) {
    const b = String(body).trim();
    return b.startsWith('{') && /"tool"\s*:/.test(b) && /"params"\s*:/.test(b);
  }
}

module.exports = ToolFenceStripper;
