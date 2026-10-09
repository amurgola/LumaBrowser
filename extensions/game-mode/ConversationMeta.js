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
    const store = this._chatStore();
    if (!store || typeof store.getConversation !== 'function') return undefined;
    try {
      const conv = store.getConversation(conversationId);
      return (conv && conv.modelRef) || undefined;
    } catch (_) { return undefined; }
  }

  _chatStore() {
    try {
      const router = typeof this._getRouter === 'function' ? this._getRouter() : null;
      return router ? router.chatStore : null;
    } catch (_) { return null; }
  }
}

module.exports = ConversationMeta;
