class ChatModeTurn {
  static PLAIN = Object.freeze({ descriptor: null, turn: null });

  constructor({ chatStore, modeRegistry }) {
    this._store = chatStore;
    this._registry = modeRegistry;
  }

  async resolve({ conversationId, messages, modelRef }) {
    try {
      const meta = this._store.getMeta(conversationId);
      if (!meta || !meta.mode || meta.mode === 'chat') return ChatModeTurn.PLAIN;
      const descriptor = this._registry.get(meta.mode);
      if (!descriptor || typeof descriptor.buildTurn !== 'function') return { descriptor: descriptor || null, turn: null };
      const turn = await descriptor.buildTurn({ meta, messages, conversationId, modelRef });
      return { descriptor, turn: turn || null };
    } catch (err) {
      console.error('[llm-chat] mode buildTurn failed; falling back to plain chat:', err && err.message);
      return ChatModeTurn.PLAIN;
    }
  }
}

module.exports = ChatModeTurn;
