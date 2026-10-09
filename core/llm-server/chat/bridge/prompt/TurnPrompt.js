class TurnPrompt {
  static from(messages, { nativeHistory = false } = {}) {
    const list = Array.isArray(messages) ? messages : [];
    const lastUser = [...list].reverse().find((m) => m && m.role === 'user');
    const prompt = lastUser ? String(lastUser.content || '') : '';
    const prior = list.slice(0, lastUser ? list.lastIndexOf(lastUser) : 0)
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content);
    return new TurnPrompt(prompt, prior, nativeHistory);
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
