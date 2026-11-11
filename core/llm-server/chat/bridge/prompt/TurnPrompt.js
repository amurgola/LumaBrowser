const SentForm = require('./SentForm');
const ToolCallReplay = require('./ToolCallReplay');

class TurnPrompt {
  static from(messages, { nativeHistory = false, sentForms = null } = {}) {
    const list = Array.isArray(messages) ? messages : [];
    const lastUser = [...list].reverse().find((m) => m && m.role === 'user');
    const prompt = lastUser ? String(lastUser.content || '') : '';
    const prior = list.slice(0, lastUser ? list.lastIndexOf(lastUser) : 0)
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content);
    if (!nativeHistory) return new TurnPrompt(prompt, prior, false);
    return new TurnPrompt(prompt, ToolCallReplay.expand(TurnPrompt.withSentForms(prior, sentForms), sentForms), true);
  }

  static withSentForms(prior, rows) {
    if (!Array.isArray(rows) || !rows.length) return prior;
    const users = rows.filter((r) => r && r.role === 'user' && r.variantActive !== false);
    let cursor = 0;
    return prior.map((m) => {
      if (!m || m.role !== 'user') return m;
      const at = users.findIndex((r, i) => i >= cursor && r.content === m.content);
      if (at === -1) return m;
      cursor = at + 1;
      const durable = SentForm.durable(users[at]);
      return durable === m.content ? m : { ...m, content: durable };
    });
  }

  constructor(prompt, prior, nativeHistory) {
    this.prompt = prompt;
    this.priorTurns = nativeHistory ? prior.map((m) => ({ role: m.role, content: String(m.content) })) : null;
    this._priorContext = nativeHistory ? '' : prior
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');
  }

  body() {
    return this._priorContext ? `${this._priorContext}\n\nUser: ${this.prompt}` : this.prompt;
  }
}

module.exports = TurnPrompt;
