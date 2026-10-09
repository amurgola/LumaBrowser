const AgentToolCatalog = require('../../core/llm-service/AgentToolCatalog');

class PublishedToolEnabler {
  constructor({ rawDb, getChatStore }) {
    this._db = rawDb;
    this._getChatStore = getChatStore;
  }

  enable(name, conversationId) {
    const out = { global: this._enableGlobally(name), conversation: false, groupActivated: false };
    if (!conversationId) return out;
    const chatStore = this._getChatStore();
    if (!chatStore) return out;
    try {
      this._enableInConversation(chatStore, name, conversationId, out);
    } catch (_) {}
    return out;
  }

  _enableGlobally(name) {
    try {
      const denied = this._db.get(AgentToolCatalog.DISABLED_TOOLS_KEY, []);
      const list = Array.isArray(denied) ? denied : [];
      if (list.includes(name)) this._db.set(AgentToolCatalog.DISABLED_TOOLS_KEY, list.filter((entry) => entry !== name));
      const seeded = this._db.get(AgentToolCatalog.SEEDED_TOOLS_KEY, []);
      if (Array.isArray(seeded) && !seeded.includes(name)) this._db.set(AgentToolCatalog.SEEDED_TOOLS_KEY, [...seeded, name]);
      return true;
    } catch (_) {
      return false;
    }
  }

  _enableInConversation(chatStore, name, conversationId, out) {
    const conversation = chatStore.getConversation(conversationId);
    if (!conversation) return;
    const off = Array.isArray(conversation.disabledTools) ? conversation.disabledTools : [];
    if (off.includes(name)) chatStore.setConversationDisabledTools(conversationId, off.filter((entry) => entry !== name));
    out.conversation = true;
    PublishedToolEnabler._activateGroup(chatStore, name, conversationId);
    out.groupActivated = true;
  }

  static _activateGroup(chatStore, name, conversationId) {
    const meta = chatStore.getMeta(conversationId);
    const data = { ...(meta.data || {}) };
    const active = Array.isArray(data.activeToolGroups) ? data.activeToolGroups : [];
    if (!active.includes(name)) chatStore.setMeta(conversationId, { data: { ...data, activeToolGroups: [...active, name] } });
  }
}

module.exports = PublishedToolEnabler;
