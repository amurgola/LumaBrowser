const ThinkingOffParams = require('./ThinkingOffParams');

class NoThinkDirective {
  static SUFFIX =
    '\n\n---\nIMPORTANT: Do NOT emit <think> or <thinking> blocks. Do NOT prefix your response with chain-of-thought reasoning. Respond directly with only the requested output (JSON or otherwise) \u2014 no preamble, no meta-commentary.\n/no_think';

  static apply(modelId, messages) {
    if (!Array.isArray(messages) || messages.length === 0) return messages;
    if (!ThinkingOffParams.isQwenFamily(modelId)) return messages;
    const index = NoThinkDirective._lastUserIndex(messages);
    if (index === -1) return messages;
    const content = NoThinkDirective._withDirective(messages[index].content);
    if (content === null) return messages;
    const out = messages.slice();
    out[index] = { ...messages[index], content };
    return out;
  }

  static _lastUserIndex(messages) {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i] && messages[i].role === 'user') return i;
    }
    return -1;
  }

  static _withDirective(content) {
    if (typeof content === 'string') {
      return NoThinkDirective._hasDirective(content) ? null : content + NoThinkDirective.SUFFIX;
    }
    if (Array.isArray(content)) return NoThinkDirective._withDirectiveInParts(content);
    return null;
  }

  static _withDirectiveInParts(parts) {
    const lastText = NoThinkDirective._lastTextIndex(parts);
    if (lastText !== -1 && NoThinkDirective._hasDirective(parts[lastText].text)) return null;
    const out = parts.slice();
    if (lastText === -1) {
      out.push({ type: 'text', text: NoThinkDirective.SUFFIX.trim() });
    } else {
      out[lastText] = { ...out[lastText], text: (out[lastText].text || '') + NoThinkDirective.SUFFIX };
    }
    return out;
  }

  static _lastTextIndex(parts) {
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i] && parts[i].type === 'text') return i;
    }
    return -1;
  }

  static _hasDirective(text) {
    return /\/no_?think\b/i.test(text || '') || /Do NOT emit <think>/i.test(text || '');
  }
}

module.exports = NoThinkDirective;
