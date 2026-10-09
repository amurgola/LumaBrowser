class ModeReaction {
  constructor({ chatStore }) {
    this._store = chatStore;
  }

  run(modeDescriptor, { content, conversationId, assistantMessageId, send, aborted = false }) {
    if (!modeDescriptor || typeof modeDescriptor.postProcess !== 'function') return;
    Promise.resolve()
      .then(() => modeDescriptor.postProcess({
        content,
        conversationId,
        assistantMessageId,
        aborted,
        meta: this._store.getMeta(conversationId),
        emit: (type, payload) => { try { send(type, payload); } catch (_) {} },
        setMeta: (patch) => this._store.setMeta(conversationId, patch),
      }))
      .catch((err) => console.error('[llm-chat] mode postProcess failed:', err && err.message));
  }
}

module.exports = ModeReaction;
