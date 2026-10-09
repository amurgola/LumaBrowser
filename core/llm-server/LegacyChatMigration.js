class LegacyChatMigration {
  static MARKER_KEY = 'aiChat.conversationsMigratedAt.v2';
  static CONVOS_KEY = 'aiChat.conversations';
  static DEFAULT_TITLE = 'Imported AI Chat';

  constructor(settingsDb, chatStore, { log } = {}) {
    this._settingsDb = settingsDb;
    this._chatStore = chatStore;
    this._log = log || ((message) => console.log(`[legacy-chat-migration] ${message}`));
    this._migrated = 0;
    this._skipped = 0;
  }

  run() {
    if (this._settingsDb.get(LegacyChatMigration.MARKER_KEY, null)) {
      return { ran: false, migrated: 0, skipped: 0 };
    }
    const nowIso = new Date().toISOString();
    const legacy = LegacyChatMigration.readLegacyConversations(
      this._settingsDb.get(LegacyChatMigration.CONVOS_KEY, null));
    for (const conversation of legacy) this._migrateSafely(conversation, nowIso);
    this._settingsDb.set(LegacyChatMigration.MARKER_KEY, nowIso);
    this._logSummary(legacy.length);
    return { ran: true, migrated: this._migrated, skipped: this._skipped };
  }

  static readLegacyConversations(blob) {
    if (Array.isArray(blob)) return blob;
    if (Array.isArray(blob && blob.conversations)) return blob.conversations;
    return [];
  }

  static isVisibleLegacyMessage(message) {
    if (!message || typeof message.content !== 'string' || typeof message.role !== 'string') return false;
    if (message.role !== 'user' && message.role !== 'assistant') return false;
    if (message.role === 'user' && message.content.startsWith('[Tool Result for ')) return false;
    if (message.role === 'assistant' && message.content.includes('```tool')) return false;
    return true;
  }

  _migrateSafely(conversation, nowIso) {
    try {
      if (this._migrateConversation(conversation, nowIso)) this._migrated++;
      else this._skipped++;
    } catch (err) {
      this._skipped++;
      this._log(`conversation ${conversation && conversation.id} failed to migrate: ${err.message}`);
    }
  }

  _migrateConversation(conversation, nowIso) {
    if (!this._isMigratable(conversation)) return false;
    const visible = (Array.isArray(conversation.history) ? conversation.history : [])
      .filter(LegacyChatMigration.isVisibleLegacyMessage);
    if (visible.length === 0) return false;
    const createdAt = LegacyChatMigration._toIso(conversation.createdAt, nowIso);
    const updatedAt = LegacyChatMigration._toIso(conversation.updatedAt, createdAt);
    this._createConversation(conversation);
    this._addMessages(conversation.id, visible, createdAt);
    this._restoreTimestamps(conversation.id, createdAt, updatedAt);
    return true;
  }

  _isMigratable(conversation) {
    if (!conversation || typeof conversation.id !== 'string' || !conversation.id) return false;
    return !this._chatStore.getConversation(conversation.id);
  }

  _createConversation(conversation) {
    const title = (conversation.title && String(conversation.title).trim()) || LegacyChatMigration.DEFAULT_TITLE;
    this._chatStore.createConversation({ id: conversation.id, title });
  }

  _addMessages(conversationId, messages, createdAt) {
    const baseMs = Date.parse(createdAt);
    messages.forEach((message, i) => {
      this._chatStore.addMessage({
        conversationId,
        role: message.role,
        content: message.content,
        createdAt: new Date(baseMs + i).toISOString(),
      });
    });
  }

  _restoreTimestamps(conversationId, createdAt, updatedAt) {
    this._chatStore.restoreConversationTimestamps(conversationId, createdAt, updatedAt);
  }

  _logSummary(total) {
    if (!total) return;
    this._log(`migrated ${this._migrated} of ${total} legacy AI-chat conversations into ChatStore `
      + `(${this._skipped} skipped; original blob retained as backup)`);
  }

  static _toIso(ms, fallbackIso) {
    const value = Number(ms);
    return Number.isFinite(value) && value > 0 ? new Date(value).toISOString() : fallbackIso;
  }
}

module.exports = LegacyChatMigration;
