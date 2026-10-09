class ConversationTitle {
  static PLACEHOLDER = 'New chat';
  static MAX_CHARS = 60;

  static fromText(text) {
    const t = String(text || '').replace(/\s+/g, ' ').trim();
    if (!t) return ConversationTitle.PLACEHOLDER;
    return t.length > ConversationTitle.MAX_CHARS ? t.slice(0, ConversationTitle.MAX_CHARS).trimEnd() + '…' : t;
  }

  static firstUserText(messages) {
    const m = (messages || []).find((x) => x && x.role === 'user' && x.content);
    return m ? String(m.content) : '';
  }

  static clean(generated) {
    return String(generated)
      .replace(/^["'`\s]+|["'`\s]+$/g, '')
      .replace(/\s+/g, ' ')
      .split('\n')[0]
      .slice(0, ConversationTitle.MAX_CHARS)
      .trim();
  }
}

module.exports = ConversationTitle;
