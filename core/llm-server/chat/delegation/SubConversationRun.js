class SubConversationRun {
  static POLL_MS = 400;
  static MAX_REPLY_CHARS = 6000;

  constructor({ router, emit, isAborted, card }) {
    this._router = router;
    this._emit = typeof emit === 'function' ? emit : null;
    this._isAborted = typeof isAborted === 'function' ? isAborted : () => false;
    this._card = card;
    this._text = '';
    this._asstId = null;
    this._settle = null;
  }

  async run({ conversationId, modelRef, messages, userMessage, runApprovals = null }) {
    const ctl = new AbortController();
    const poll = setInterval(() => { if (this._isAborted()) ctl.abort(); }, SubConversationRun.POLL_MS);
    const settled = new Promise((resolve) => { this._settle = resolve; });
    this._cardEvent({ phase: 'start' });
    try {
      const res = await this._router.chat({
        conversationId, modelRef, messages, userMessage, agent: true,
        send: (type, payload) => this._on(type, payload),
        nested: { signal: ctl.signal },
        runApprovals,
      });
      if (!res || res.success === false) this._finish({ error: (res && res.error) || 'the turn could not start' });
      return this._result(await settled);
    } catch (err) {
      this._finish({ error: (err && err.message) || String(err) });
      return this._result(await settled);
    } finally {
      clearInterval(poll);
    }
  }

  _on(type, payload) {
    const p = payload || {};
    switch (type) {
      case 'meta': if (p.assistantMessageId) this._asstId = p.assistantMessageId; return;
      case 'delta': this._text += p.text || ''; this._cardEvent({ phase: 'delta', text: p.text || '' }); return;
      case 'reasoning-delta': this._cardEvent({ phase: 'reasoning', text: p.text || '' }); return;
      case 'rollback': this._rollback(p.chars); return;
      case 'tool': this._tool(p); return;
      case 'done': this._finish({ aborted: !!p.aborted }); return;
      case 'error': this._finish({ error: p.message || 'the sub-conversation failed' }); return;
      default: return;
    }
  }

  _tool(p) {
    if (p.phase === 'approval' || p.phase === 'approval-done') {
      if (this._emit) this._safeEmit({ type: 'tool', payload: p.phase === 'approval' ? this._scoped(p) : p });
      return;
    }
    this._cardEvent({ phase: 'tool', tool: p });
  }

  _scoped(p) {
    const scope = `"Allow for this run" covers the rest of ${this._card.label}.`;
    return { ...p, detail: p.detail ? `${p.detail} ${scope}` : scope };
  }

  _rollback(chars) {
    const n = Math.min(Number(chars) || 0, this._text.length);
    if (!n) return;
    this._text = this._text.slice(0, this._text.length - n);
    this._cardEvent({ phase: 'rollback', chars: n });
  }

  _finish(outcome) {
    if (!this._settle) return;
    const settle = this._settle;
    this._settle = null;
    if (outcome.error) this._cardEvent({ phase: 'error', message: outcome.error });
    else this._cardEvent({ phase: 'done' });
    settle(outcome);
  }

  _result(outcome) {
    const reply = SubConversationRun._clip(this._persistedReply() || this._text);
    if (outcome.error) return { status: 'failed', reply, error: outcome.error };
    return { status: outcome.aborted ? 'stopped' : 'done', reply };
  }

  _persistedReply() {
    try {
      const row = this._asstId && this._router.chatStore.getMessage(this._asstId);
      return row && typeof row.content === 'string' ? row.content : '';
    } catch (_) {
      return '';
    }
  }

  _cardEvent(p) {
    if (!this._emit) return;
    this._safeEmit({ ...p, invocationId: this._card.invocationId, agentName: this._card.label, conversationId: this._card.conversationId });
  }

  _safeEmit(payload) {
    try { this._emit(payload); } catch (_) {}
  }

  static _clip(text) {
    const s = String(text || '').trim();
    if (s.length <= SubConversationRun.MAX_REPLY_CHARS) return s;
    return '[earlier output trimmed]\n' + s.slice(s.length - SubConversationRun.MAX_REPLY_CHARS);
  }
}

module.exports = SubConversationRun;
