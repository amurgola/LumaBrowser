const ChatModeRegistry = require('../chat/ChatModeRegistry');

class HiddenRunConversations {
  constructor({ llmServerService, modeRegistry = ChatModeRegistry.shared }) {
    this._svc = llmServerService;
    this._modes = modeRegistry;
  }

  purge(conversationIds) {
    for (const id of conversationIds || []) {
      try { this._modes.notifyConversationDeleted(this._svc.chatStore.getMeta(id)); } catch (_) {}
      try { this._svc.chatStore.deleteConversation(id); } catch (_) {}
    }
  }
}

module.exports = HiddenRunConversations;
