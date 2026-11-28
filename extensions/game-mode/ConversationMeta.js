class ConversationMeta {
  constructor(getRouter = () => global.__lumaChatRouter) {
    this._getRouter = getRouter;
  }

  dataFor(conversationId) {
    const store = this._chatStore();
    if (!store || typeof store.getMeta !== 'function') return {};
    try {
      const meta = store.getMeta(conversationId);
      return (meta && meta.data) || {};
    } catch (_) { return {}; }
  }

  modelRefFor(conversationId) {
    const stored = this.dataFor(conversationId).llmModel;
    const pinned = typeof stored === 'string' ? stored.trim() : '';
    if (pinned) return pinned;
    const store = this._chatStore();
    if (!store || typeof store.getConversation !== 'function') return undefined;
    try {
      const conv = store.getConversation(conversationId);
      return (conv && conv.modelRef) || undefined;
    } catch (_) { return undefined; }
  }

  saveGame(conversationId, game) {
    const store = this._chatStore();
    if (!store || typeof store.setMeta !== 'function') return false;
    try {
      store.setMeta(conversationId, { data: { ...this.dataFor(conversationId), game } });
      return true;
    } catch (_) { return false; }
  }

  _chatStore() {
    try {
      const router = typeof this._getRouter === 'function' ? this._getRouter() : null;
      return router ? router.chatStore : null;
    } catch (_) { return null; }
  }
}

module.exports = ConversationMeta;
