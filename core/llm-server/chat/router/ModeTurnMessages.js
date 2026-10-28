class ModeTurnMessages {
  static MAX_POST_HISTORY_CHARS = 4000;

  static apply(turn, messages, { prependSystem = true } = {}) {
    const base = Array.isArray(messages) ? messages : [];
    if (!turn || typeof turn !== 'object') return base;
    let out = ModeTurnMessages._history(turn, base);
    out = ModeTurnMessages._withPostHistory(out, turn.postHistoryPrompt);
    if (prependSystem && turn.systemPrompt) out = [{ role: 'system', content: String(turn.systemPrompt) }, ...out];
    return out;
  }

  static _history(turn, base) {
    const own = turn.messages;
    if (!Array.isArray(own) || !own.length || own.length > base.length) return base;
    const last = base[base.length - 1];
    const ownLast = own[own.length - 1];
    if (!ModeTurnMessages._sameMessage(last, ownLast)) return base;
    if (!own.every((m) => m && typeof m.role === 'string')) return base;
    return own;
  }

  static _withPostHistory(messages, prompt) {
    const text = ModeTurnMessages._text(prompt);
    if (!text) return messages;
    const out = messages.slice();
    const i = out.length - 1;
    const last = out[i];
    if (last && last.role === 'user' && typeof last.content === 'string') {
      out[i] = { ...last, content: last.content + '\n\n' + text };
      return out;
    }
    if (last && last.role === 'user' && Array.isArray(last.content)) {
      out[i] = { ...last, content: [...last.content, { type: 'text', text: '\n\n' + text }] };
      return out;
    }
    out.push({ role: 'system', content: text });
    return out;
  }

  static _text(prompt) {
    if (prompt === null || prompt === undefined) return '';
    const s = String(prompt).trim();
    return s.length > ModeTurnMessages.MAX_POST_HISTORY_CHARS ? s.slice(0, ModeTurnMessages.MAX_POST_HISTORY_CHARS) : s;
  }

  static _sameMessage(a, b) {
    if (!a || !b || a.role !== b.role) return false;
    if (a === b) return true;
    try { return JSON.stringify(a.content) === JSON.stringify(b.content); } catch (_) { return false; }
  }
}

module.exports = ModeTurnMessages;
