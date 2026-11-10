class ModeReaction {
  constructor({ chatStore }) {
    this._store = chatStore;
  }

  run(modeDescriptor, { content, conversationId, assistantMessageId, send, aborted = false }) {
    if (!modeDescriptor || typeof modeDescriptor.postProcess !== 'function') return;
    const emit = (type, payload) => { try { send(type, payload); } catch (_) {} };
    Promise.resolve()
      .then(() => modeDescriptor.postProcess({
        content,
        conversationId,
        assistantMessageId,
        aborted,
        meta: this._store.getMeta(conversationId),
        emit,
        setMeta: (patch) => this._store.setMeta(conversationId, patch),
        replaceContent: (text) => this._replaceContent(assistantMessageId, text, send),
      }))
      .then(
        () => emit('mode:reaction', { messageId: assistantMessageId, status: 'done' }),
        (err) => {
          console.error('[llm-chat] mode postProcess failed:', err && err.message);
          emit('mode:reaction', { messageId: assistantMessageId, status: 'failed', error: (err && err.message) || String(err) });
        },
      );
  }

  _replaceContent(messageId, text, send) {
    const content = String(text == null ? '' : text);
    if (!messageId || !content.trim() || typeof this._store.updateMessage !== 'function') return false;
    const ok = this._store.updateMessage(messageId, { content });
    if (ok) { try { send('mode:content', { messageId, content }); } catch (_) {} }
    return !!ok;
  }
}

module.exports = ModeReaction;
