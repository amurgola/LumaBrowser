class ConversationCheckpoint {
  static META_KEY = 'compactionCheckpoint';

  static storeFor(chatStore, conversationId) {
    if (!chatStore || !conversationId) return null;
    if (typeof chatStore.getMeta !== 'function' || typeof chatStore.setMeta !== 'function') return null;
    return {
      load: () => ConversationCheckpoint._load(chatStore, conversationId),
      save: (entry) => ConversationCheckpoint._save(chatStore, conversationId, entry),
    };
  }

  static _load(chatStore, conversationId) {
    const meta = chatStore.getMeta(conversationId);
    const entry = meta && meta.data ? meta.data[ConversationCheckpoint.META_KEY] : null;
    return entry && typeof entry === 'object' ? entry : null;
  }

  static _save(chatStore, conversationId, entry) {
    if (typeof chatStore.getConversation === 'function' && !chatStore.getConversation(conversationId)) return;
    const meta = chatStore.getMeta(conversationId) || {};
    chatStore.setMeta(conversationId, { data: { ...(meta.data || {}), [ConversationCheckpoint.META_KEY]: entry } });
  }
}

module.exports = ConversationCheckpoint;
