class StoredHistory {
  static messages(chatStore, conversationId) {
    try {
      return chatStore.listActiveMessages(conversationId)
        .filter((message) => message && (message.content || message.role === 'user'))
        .map((message) => ({ role: message.role, content: message.content || '' }));
    } catch (_) {
      return [];
    }
  }
}

module.exports = StoredHistory;
