class AnthropicCacheControl {
  static MARKER = { type: 'ephemeral' };

  static apply(messages) {
    if (!Array.isArray(messages) || messages.length === 0) return messages;
    const out = messages.map((message) => ({ ...message }));
    AnthropicCacheControl._markAt(out, out.findIndex((m) => m.role === 'system'));
    AnthropicCacheControl._markAt(out, AnthropicCacheControl._lastTurnIndex(out));
    return out;
  }

  static _lastTurnIndex(messages) {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user' || messages[i].role === 'assistant') return i;
    }
    return -1;
  }

  static _markAt(messages, index) {
    if (index !== -1) messages[index] = AnthropicCacheControl._markMessage(messages[index]);
  }

  static _markMessage(message) {
    const { content } = message;
    if (typeof content === 'string') return AnthropicCacheControl._markString(message, content);
    if (Array.isArray(content)) return AnthropicCacheControl._markLastTextPart(message, content);
    return message;
  }

  static _markString(message, content) {
    if (!content) return message;
    return { ...message, content: [{ type: 'text', text: content, cache_control: AnthropicCacheControl.MARKER }] };
  }

  static _markLastTextPart(message, content) {
    for (let i = content.length - 1; i >= 0; i--) {
      if (content[i]?.type !== 'text') continue;
      const parts = content.slice();
      parts[i] = { ...content[i], cache_control: AnthropicCacheControl.MARKER };
      return { ...message, content: parts };
    }
    return message;
  }
}

module.exports = AnthropicCacheControl;
