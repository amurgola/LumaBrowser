const ChatModelRef = require('./ChatModelRef');
const ConversationTitle = require('./ConversationTitle');
const DocsSourceGrant = require('./DocsSourceGrant');

class TurnConversation {
  constructor({ chatStore, llmServerService }) {
    this._store = chatStore;
    this._service = llmServerService;
  }

  open({ conversationId, regenerateMessageId, editMessageId, userMessage, messages, modelRef, agentMode, disabledTools, choicesEnabled }) {
    let convId = conversationId;
    if (regenerateMessageId) {
      const target = this._store.getMessage(regenerateMessageId);
      if (!target) return { error: 'Message to regenerate was not found.' };
      if (target.conversationId) convId = target.conversationId;
    } else if (editMessageId) {
      const target = this._store.getMessage(editMessageId);
      if (!target || target.role !== 'user') return { error: 'Message to edit was not found.' };
      if (target.conversationId) convId = target.conversationId;
    }
    if (!convId) return { convId: this._create({ userMessage, messages, modelRef, agentMode, disabledTools, choicesEnabled }) };
    if (!this._store.getConversation(convId)) return { error: `Conversation ${convId} not found` };
    return { convId };
  }

  syncTools(convId, agentMode) {
    try { this._store.setConversationTools(convId, agentMode); } catch (_) {}
  }

  rememberDocsSource(convId, on) {
    if (typeof on !== 'boolean' || !convId) return;
    try {
      const meta = this._store.getMeta(convId);
      const data = (meta && meta.data) || {};
      const current = Array.isArray(data.docsSources) ? data.docsSources : [];
      const next = on ? [DocsSourceGrant.SOURCE_ID] : [];
      if (current.join('\n') === next.join('\n')) return;
      this._store.setMeta(convId, { data: { ...data, docsSources: next } });
    } catch (_) {}
  }

  resolveChoices(convId, choicesEnabled) {
    try {
      if (typeof choicesEnabled === 'boolean') {
        this._store.setConversationChoices(convId, choicesEnabled);
        return choicesEnabled;
      }
      const conv = this._store.getConversation(convId);
      return !!(conv && conv.choicesEnabled);
    } catch (_) {
      return typeof choicesEnabled === 'boolean' ? choicesEnabled : false;
    }
  }

  addUserMessage(convId, userMessage, modelRef, regenerating, editMessageId) {
    if (regenerating || userMessage == null || String(userMessage).length === 0) return null;
    const row = {
      conversationId: convId,
      role: 'user',
      content: String(userMessage),
      modelRef,
      provider: ChatModelRef.providerTag(modelRef),
    };
    const v = editMessageId ? this._store.startVariant(editMessageId) : null;
    if (v) Object.assign(row, { variantGroup: v.group, createdAt: v.createdAt, parentId: v.parentId });
    return this._store.addMessage(row);
  }

  rememberModel(convId, modelRef) {
    this._store.setConversationModel(convId, modelRef, ChatModelRef.providerTag(modelRef));
    if (this._service && this._service.setLastModelRef) this._service.setLastModelRef(modelRef);
  }

  pinModel(convId, modelRef) {
    try { this._store.setConversationModel(convId, modelRef, ChatModelRef.providerTag(modelRef)); } catch (_) {}
  }

  _create({ userMessage, messages, modelRef, agentMode, disabledTools, choicesEnabled }) {
    const conv = this._store.createConversation({
      title: ConversationTitle.fromText(userMessage || ConversationTitle.firstUserText(messages)),
      modelRef,
      provider: ChatModelRef.providerTag(modelRef),
      toolsEnabled: agentMode,
      disabledTools: Array.isArray(disabledTools) ? disabledTools : null,
      choicesEnabled: typeof choicesEnabled === 'boolean' ? choicesEnabled : null,
    });
    return conv.id;
  }
}

module.exports = TurnConversation;
