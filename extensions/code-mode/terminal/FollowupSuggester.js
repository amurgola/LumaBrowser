class FollowupSuggester {
  static TEMPERATURE = 0.4;
  static TIMEOUT_MS = 20000;
  static MAX_CHARS = 140;
  static INSTRUCTIONS = 'You are helping a developer drive a coding agent from their terminal. '
    + 'Given the last exchange, write the ONE most useful next instruction they might give the agent. '
    + 'Reply with only the instruction: imperative, under 12 words, no quotes, no preamble, no trailing period.';

  constructor(session) {
    this._session = session;
    this._handle = null;
  }

  suggest() {
    const router = this._session.getRouter();
    if (!router || typeof router.completeStream !== 'function') return;
    const exchange = this._lastExchange(router);
    if (!exchange.assistant) return;
    const seq = this._session.turnSeq;
    this._handle = router.completeStream(
      {
        messages: [{ role: 'user', content: FollowupSuggester._prompt(exchange) }],
        temperature: FollowupSuggester.TEMPERATURE,
        modelRef: this._session.modelRef,
        timeoutMs: FollowupSuggester.TIMEOUT_MS,
        noThink: true,
      },
      { onDone: (text) => this._onDone(seq, text), onError: () => { this._handle = null; } },
    );
  }

  stop() {
    const h = this._handle;
    this._handle = null;
    if (h) {
      try { h.abort(); } catch (_) {}
    }
  }

  static clean(text) {
    const first = String(text || '').split('\n').map((l) => l.trim()).filter(Boolean)[0] || '';
    return first.replace(/^["'`\s]+|["'`\s.]+$/g, '').slice(0, FollowupSuggester.MAX_CHARS);
  }

  _lastExchange(router) {
    let last = [];
    try {
      last = router.chatStore.listActiveMessages(this._session.conversationId).filter((m) => m && m.content).slice(-2);
    } catch (_) { last = []; }
    return { user: last.find((m) => m.role === 'user'), assistant: last.find((m) => m.role === 'assistant') };
  }

  _onDone(seq, text) {
    this._handle = null;
    const s = this._session;
    if (s.closed || s.turnActive || seq !== s.turnSeq) return;
    const suggestion = FollowupSuggester.clean(text);
    if (suggestion) s.send('suggest', { text: suggestion });
  }

  static _prompt({ user, assistant }) {
    return `${FollowupSuggester.INSTRUCTIONS}\n\n`
      + `User: ${String((user && user.content) || '').slice(0, 800)}\n`
      + `Agent: ${String(assistant.content || '').slice(-1200)}`;
  }
}

module.exports = FollowupSuggester;
