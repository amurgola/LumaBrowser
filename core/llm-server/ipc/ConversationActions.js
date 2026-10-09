class ConversationActions {
  static CONTENT_REQUIRED = 'content required';

  constructor(llmServerService) {
    this._svc = llmServerService;
  }

  list(opts) { return { conversations: this._store().listConversations(opts || {}) }; }
  get(id) { return { conversation: this._store().getConversation(id) }; }
  create(data) { return { conversation: this._store().createConversation(data || {}) }; }
  search(q, opts) { return { conversations: this._store().searchConversations(q, opts || {}) }; }
  rename(id, title) { return { success: this._store().renameConversation(id, title) }; }
  archive(id, archived) { return { success: this._store().archiveConversation(id, archived) }; }
  pin(id, pinned) { return { success: this._store().pinConversation(id, pinned) }; }

  messages(conversationId) { return { messages: this._store().listActiveMessages(conversationId) }; }
  variants(group) { return { variants: this._store().getVariants(group) }; }
  setVariant(messageId) { return { success: this._store().setActiveVariant(messageId) }; }
  addMessage(msg) { return { message: this._store().addMessage(msg || {}) }; }

  deleteMessage(id) { return { success: this._store().deleteMessage(id) }; }

  updateMessage(id, patch) {
    if (!patch || typeof patch.content !== 'string') return { success: false, error: ConversationActions.CONTENT_REQUIRED };
    return { success: this._store().updateMessage(id, { content: patch.content }) };
  }

  clearMessages(id) { return { success: this._store().clearMessages(id) }; }

  setTools(id, enabled) { return { success: this._store().setConversationTools(id, !!enabled) }; }

  setDisabledTools(id, names) { return { success: this._store().setConversationDisabledTools(id, names) }; }

  setChoices(id, enabled) { return { success: this._store().setConversationChoices(id, !!enabled) }; }

  setReasoningEffort(id, position) { return { success: this._store().setConversationReasoningEffort(id, position) }; }

  getMeta(conversationId) { return { meta: this._store().getMeta(conversationId) }; }
  setMeta(conversationId, patch) { return { meta: this._store().setMeta(conversationId, patch || {}) }; }

  _store() {
    return this._svc.chatStore;
  }
}

module.exports = ConversationActions;
