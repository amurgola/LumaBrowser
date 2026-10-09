class RunTranscript {
  static DEFAULT_KEEP = 20;

  constructor(chatStore, conversation) {
    this._chatStore = chatStore;
    this.conversation = conversation;
  }

  static open(chatStore, { title, label, modelRef }) {
    const conversation = chatStore.createConversation({
      title: `${title} ${label} ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
      modelRef: modelRef || null,
      toolsEnabled: true,
      hidden: true,
    });
    return new RunTranscript(chatStore, conversation);
  }

  get conversationId() {
    return this.conversation.id;
  }

  addUser(content) {
    this._chatStore.addMessage({ conversationId: this.conversationId, role: 'user', content });
  }

  addAssistant(result, modelRef) {
    this._chatStore.addMessage({
      conversationId: this.conversationId,
      role: 'assistant',
      content: result.finalResponse || '',
      modelRef: modelRef || null,
      error: RunTranscript.errorText(result.error),
      toolCalls: { tools: result.toolTrace || [], artifacts: [] },
    });
  }

  static errorText(error) {
    return error ? String(error.message || error) : null;
  }

  static keepCount(settingsDb, key) {
    const value = settingsDb ? settingsDb.get(key, RunTranscript.DEFAULT_KEEP) : RunTranscript.DEFAULT_KEEP;
    const n = parseInt(value, 10);
    return Number.isFinite(n) && n >= 0 ? n : RunTranscript.DEFAULT_KEEP;
  }

  static prune(store, ownerId, keep, chatStore) {
    try {
      for (const id of store.pruneTranscripts(ownerId, keep)) {
        try { chatStore.deleteConversation(id); } catch (_) {}
      }
    } catch (_) {}
  }
}

module.exports = RunTranscript;
