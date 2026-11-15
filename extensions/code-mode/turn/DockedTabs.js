class DockedTabs {
  constructor() {
    this._tabByConversation = new Map();
  }

  set(conversationId, tabId) {
    if (!conversationId) return;
    if (tabId == null) this._tabByConversation.delete(conversationId);
    else this._tabByConversation.set(conversationId, tabId);
  }

  get(conversationId) {
    return this._tabByConversation.has(conversationId) ? this._tabByConversation.get(conversationId) : null;
  }
}

module.exports = DockedTabs;
