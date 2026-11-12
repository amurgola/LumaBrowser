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
    const line = String(generated).split(/\r?\n/).map((l) => l.trim()).find((l) => /[\p{L}\p{N}]/u.test(l)) || '';
    return line
      .replace(/^[#>\-*\s]+/, '')
      .replace(/^title\s*:\s*/i, '')
      .replace(/[*`]+|(?<![\p{L}\p{N}])_+|_+(?![\p{L}\p{N}])/gu, '')
      .replace(/^["'\s]+|["'\s.]+$/g, '')
      .replace(/\s+/g, ' ')
      .slice(0, ConversationTitle.MAX_CHARS)
      .trim();
  }
}

module.exports = ConversationTitle;
