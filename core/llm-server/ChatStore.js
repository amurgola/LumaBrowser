const StoreHandle = require('../database/StoreHandle');
const RecordId = require('../database/RecordId');
const JsonColumn = require('../database/JsonColumn');
const ReasoningEffort = require('../shared/llm/ReasoningEffort');
const MessageTree = require('./chat/MessageTree');

class ChatStore {
  static DEFAULT_TITLE = 'New chat';
  static DEFAULT_MODE = 'chat';
  static MAX_LIST_LIMIT = 1000;
  static MAX_SEARCH_LIMIT = 200;

  static SQL = {
    insertConversation: `
      INSERT INTO llm_conversations
        (id, title, model_ref, provider, pinned, archived, hidden, tools_enabled, disabled_tools, choices_enabled, mode, created_at, updated_at)
      VALUES
        (@id, @title, @model_ref, @provider, @pinned, @archived, @hidden, @tools_enabled, @disabled_tools, @choices_enabled, @mode, @created_at, @updated_at)`,
    getConversation: 'SELECT * FROM llm_conversations WHERE id = ?',
    listConversations: `
      SELECT * FROM llm_conversations
      WHERE (@include_archived = 1 OR archived = 0) AND (@include_hidden = 1 OR hidden = 0)
      ORDER BY pinned DESC, updated_at DESC
      LIMIT @limit OFFSET @offset`,
    searchConversations: `
      SELECT DISTINCT c.* FROM llm_conversations c
      LEFT JOIN llm_messages m ON m.conversation_id = c.id
      WHERE (c.title LIKE @pattern OR m.content LIKE @pattern)
        AND (@include_archived = 1 OR c.archived = 0) AND c.hidden = 0
      ORDER BY c.pinned DESC, c.updated_at DESC
      LIMIT @limit`,
    setMode: 'UPDATE llm_conversations SET mode = ?, updated_at = ? WHERE id = ?',
    rename: 'UPDATE llm_conversations SET title = ?, updated_at = ? WHERE id = ?',
    setModel: 'UPDATE llm_conversations SET model_ref = ?, provider = ?, updated_at = ? WHERE id = ?',
    setTools: 'UPDATE llm_conversations SET tools_enabled = ?, updated_at = ? WHERE id = ?',
    setDisabledTools: 'UPDATE llm_conversations SET disabled_tools = ?, updated_at = ? WHERE id = ?',
    setChoices: 'UPDATE llm_conversations SET choices_enabled = ?, updated_at = ? WHERE id = ?',
    setReasoning: 'UPDATE llm_conversations SET reasoning_effort = ?, updated_at = ? WHERE id = ?',
    touch: 'UPDATE llm_conversations SET updated_at = ? WHERE id = ?',
    pin: 'UPDATE llm_conversations SET pinned = ?, updated_at = ? WHERE id = ?',
    archive: 'UPDATE llm_conversations SET archived = ?, updated_at = ? WHERE id = ?',
    restoreTimestamps: 'UPDATE llm_conversations SET created_at = ?, updated_at = ? WHERE id = ?',
    deleteConversation: 'DELETE FROM llm_conversations WHERE id = ?',
    getMeta: 'SELECT * FROM llm_conversation_meta WHERE conversation_id = ?',
    upsertMeta: `
      INSERT INTO llm_conversation_meta (conversation_id, mode, data, updated_at)
      VALUES (@conversation_id, @mode, @data, @updated_at)
      ON CONFLICT(conversation_id) DO UPDATE SET mode = @mode, data = @data, updated_at = @updated_at`,
    deleteMeta: 'DELETE FROM llm_conversation_meta WHERE conversation_id = ?',
    insertMessage: `
      INSERT INTO llm_messages
        (id, conversation_id, role, content, reasoning, model_ref, provider,
         tokens_in, tokens_out, error, tool_calls, variant_group, variant_active, parent_id, created_at)
      VALUES
        (@id, @conversation_id, @role, @content, @reasoning, @model_ref, @provider,
         @tokens_in, @tokens_out, @error, @tool_calls, @variant_group, @variant_active, @parent_id, @created_at)`,
    updateMessage: `
      UPDATE llm_messages
      SET content = @content, reasoning = @reasoning, tokens_in = @tokens_in,
          tokens_out = @tokens_out, error = @error, tool_calls = @tool_calls
      WHERE id = @id`,
    getMessage: 'SELECT * FROM llm_messages WHERE id = ?',
    listMessages: 'SELECT * FROM llm_messages WHERE conversation_id = ? ORDER BY created_at ASC, rowid ASC',
    listVariants: 'SELECT * FROM llm_messages WHERE variant_group = ? ORDER BY created_at ASC, rowid ASC',
    deactivateGroup: 'UPDATE llm_messages SET variant_active = 0 WHERE variant_group = ?',
    setVariantActive: 'UPDATE llm_messages SET variant_active = ? WHERE id = ?',
    setVariantGroup: 'UPDATE llm_messages SET variant_group = ? WHERE id = ?',
    deleteMessage: 'DELETE FROM llm_messages WHERE id = ?',
    reparentChildren: 'UPDATE llm_messages SET parent_id = ? WHERE parent_id = ?',
    deleteConversationMessages: 'DELETE FROM llm_messages WHERE conversation_id = ?',
  };

  constructor(settingsDb) {
    this.db = StoreHandle.requireOpen(settingsDb, 'ChatStore');
    this._statements = {};
    for (const [name, sql] of Object.entries(ChatStore.SQL)) this._statements[name] = this.db.prepare(sql);
  }


  createConversation({ id, title, modelRef, provider, toolsEnabled, disabledTools, choicesEnabled, mode, hidden } = {}) {
    const now = ChatStore._now();
    const row = {
      id: id || RecordId.create('conv'),
      title: ChatStore._cleanTitle(title),
      model_ref: modelRef || null,
      provider: provider || null,
      pinned: 0,
      archived: 0,
      hidden: hidden ? 1 : 0,
      tools_enabled: toolsEnabled ? 1 : 0,
      disabled_tools: ChatStore._serializeDisabledTools(disabledTools),
      choices_enabled: ChatStore._toTriState(choicesEnabled),
      mode: ChatStore._cleanMode(mode),
      created_at: now,
      updated_at: now,
    };
    this._statements.insertConversation.run(row);
    return this.getConversation(row.id);
  }

  getConversation(id) {
    const row = this._statements.getConversation.get(id);
    return row ? ChatStore._hydrateConversation(row) : null;
  }

  listConversations({ includeArchived = false, includeHidden = false, limit = 200, offset = 0 } = {}) {
    return this._statements.listConversations.all({
      include_archived: includeArchived ? 1 : 0,
      include_hidden: includeHidden ? 1 : 0,
      limit: Math.min(limit, ChatStore.MAX_LIST_LIMIT),
      offset,
    }).map(ChatStore._hydrateConversation);
  }

  searchConversations(query, { limit = 50, includeArchived = false } = {}) {
    const term = (query || '').trim();
    if (!term) return [];
    return this._statements.searchConversations.all({
      pattern: `%${term}%`,
      include_archived: includeArchived ? 1 : 0,
      limit: Math.min(limit, ChatStore.MAX_SEARCH_LIMIT),
    }).map(ChatStore._hydrateConversation);
  }

  renameConversation(id, title) {
    return this._changed(this._statements.rename.run(ChatStore._cleanTitle(title), ChatStore._now(), id));
  }

  setConversationModel(id, modelRef, provider) {
    return this._changed(this._statements.setModel.run(modelRef || null, provider || null, ChatStore._now(), id));
  }

  setConversationTools(id, enabled) {
    return this._changed(this._statements.setTools.run(enabled ? 1 : 0, ChatStore._now(), id));
  }

  setConversationDisabledTools(id, names) {
    const value = ChatStore._serializeDisabledTools(names);
    return this._changed(this._statements.setDisabledTools.run(value, ChatStore._now(), id));
  }

  setConversationChoices(id, enabled) {
    return this._changed(this._statements.setChoices.run(enabled ? 1 : 0, ChatStore._now(), id));
  }

  setConversationReasoningEffort(id, position) {
    const value = ChatStore._isBlank(position) ? null : ReasoningEffort.normalizeDial(position);
    return this._changed(this._statements.setReasoning.run(value, ChatStore._now(), id));
  }

  setConversationMode(id, mode) {
    return this._changed(this._statements.setMode.run(ChatStore._cleanMode(mode), ChatStore._now(), id));
  }

  touchConversation(id) {
    return this._changed(this._statements.touch.run(ChatStore._now(), id));
  }

  pinConversation(id, pinned) {
    return this._changed(this._statements.pin.run(pinned ? 1 : 0, ChatStore._now(), id));
  }

  archiveConversation(id, archived) {
    return this._changed(this._statements.archive.run(archived ? 1 : 0, ChatStore._now(), id));
  }

  restoreConversationTimestamps(id, createdAt, updatedAt) {
    return this._changed(this._statements.restoreTimestamps.run(createdAt, updatedAt, id));
  }

  deleteConversation(id) {
    return this.db.transaction(() => {
      this._statements.deleteConversationMessages.run(id);
      this._statements.deleteMeta.run(id);
      return this._changed(this._statements.deleteConversation.run(id));
    })();
  }


  getMeta(conversationId) {
    const row = this._statements.getMeta.get(conversationId);
    if (row) return ChatStore._hydrateMeta(conversationId, row);
    const conversation = this._statements.getConversation.get(conversationId);
    return { conversationId, mode: (conversation && conversation.mode) || ChatStore.DEFAULT_MODE, data: {}, updatedAt: null };
  }

  setMeta(conversationId, { mode, data } = {}) {
    if (!conversationId) throw new Error('setMeta: conversationId is required');
    const now = ChatStore._now();
    const current = this.getMeta(conversationId);
    const nextMode = (mode && String(mode).trim()) || current.mode || ChatStore.DEFAULT_MODE;
    const nextData = data !== undefined ? (data || {}) : current.data;
    this.db.transaction(() => {
      this._statements.upsertMeta.run({
        conversation_id: conversationId, mode: nextMode, data: JSON.stringify(nextData), updated_at: now,
      });
      this._statements.setMode.run(nextMode, now, conversationId);
    })();
    return { conversationId, mode: nextMode, data: nextData, updatedAt: now };
  }


  addMessage({
    id, conversationId, role, content = '', reasoning = null,
    modelRef = null, provider = null, tokensIn = null, tokensOut = null,
    error = null, toolCalls = null, variantGroup = null, variantActive = 1, createdAt = null, parentId,
  }) {
    if (!conversationId) throw new Error('addMessage: conversationId is required');
    if (!role) throw new Error('addMessage: role is required');
    const now = ChatStore._now();
    const row = {
      id: id || RecordId.create('msg'),
      conversation_id: conversationId,
      role,
      content: content || '',
      reasoning: reasoning || null,
      model_ref: modelRef || null,
      provider: provider || null,
      tokens_in: tokensIn ?? null,
      tokens_out: tokensOut ?? null,
      error: error || null,
      tool_calls: ChatStore._serializeToolCalls(toolCalls),
      variant_group: variantGroup || null,
      variant_active: variantActive ? 1 : 0,
      parent_id: null,
      created_at: createdAt || now,
    };
    this.db.transaction(() => {
      row.parent_id = parentId !== undefined
        ? (parentId || null)
        : MessageTree.leafId(this._statements.listMessages.all(conversationId));
      this._statements.insertMessage.run(row);
      this._statements.touch.run(now, conversationId);
    })();
    return this.getMessage(row.id);
  }

  updateMessage(id, patch = {}) {
    const existing = this._statements.getMessage.get(id);
    if (!existing) return false;
    this._statements.updateMessage.run(ChatStore._patchedMessageRow(existing, patch));
    return true;
  }

  getMessage(id) {
    const row = this._statements.getMessage.get(id);
    return row ? ChatStore._hydrateMessage(row) : null;
  }

  listMessages(conversationId) {
    return this._statements.listMessages.all(conversationId).map(ChatStore._hydrateMessage);
  }

  listActiveMessages(conversationId) {
    const rows = this._statements.listMessages.all(conversationId);
    const groups = new Map();
    for (const r of rows) {
      if (!r.variant_group) continue;
      if (!groups.has(r.variant_group)) groups.set(r.variant_group, []);
      groups.get(r.variant_group).push(r.id);
    }
    return MessageTree.activePath(rows).map((row) => ChatStore._hydrateActiveMessage(row, groups.get(row.variant_group)));
  }

  getVariants(group) {
    if (!group) return [];
    return this._statements.listVariants.all(group).map(ChatStore._hydrateMessage);
  }

  setActiveVariant(messageId) {
    const row = this._statements.getMessage.get(messageId);
    if (!row || !row.variant_group) return false;
    this.db.transaction(() => {
      this._statements.deactivateGroup.run(row.variant_group);
      this._statements.setVariantActive.run(1, messageId);
    })();
    return true;
  }

  startVariant(messageId) {
    const row = this._statements.getMessage.get(messageId);
    if (!row) return null;
    const group = row.variant_group || row.id;
    this.db.transaction(() => {
      if (!row.variant_group) this._statements.setVariantGroup.run(group, row.id);
      this._statements.deactivateGroup.run(group);
    })();
    const root = this._statements.getMessage.get(group);
    return { group, parentId: row.parent_id || null, createdAt: (root && root.created_at) || row.created_at };
  }

  deleteMessage(id) {
    const row = this._statements.getMessage.get(id);
    if (!row) return false;
    return this.db.transaction(() => {
      this._statements.reparentChildren.run(row.parent_id || null, id);
      return this._changed(this._statements.deleteMessage.run(id));
    })();
  }

  clearMessages(conversationId) {
    if (!conversationId) return false;
    this._statements.deleteConversationMessages.run(conversationId);
    return true;
  }


  static _hydrateActiveMessage(row, siblingIds) {
    const message = ChatStore._hydrateMessage(row);
    if (siblingIds && siblingIds.length > 1) {
      message.variantCount = siblingIds.length;
      message.variantIndex = Math.max(1, siblingIds.indexOf(row.id) + 1);
    } else {
      message.variantCount = 0;
    }
    return message;
  }

  _changed(result) {
    return result.changes > 0;
  }

  static _hydrateConversation(row) {
    return {
      id: row.id,
      title: row.title,
      modelRef: row.model_ref,
      provider: row.provider,
      pinned: !!row.pinned,
      archived: !!row.archived,
      hidden: !!row.hidden,
      toolsEnabled: !!row.tools_enabled,
      disabledTools: ChatStore._parseDisabledTools(row.disabled_tools),
      choicesEnabled: row.choices_enabled == null ? null : !!row.choices_enabled,
      reasoningEffort: row.reasoning_effort || null,
      mode: row.mode || ChatStore.DEFAULT_MODE,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static _hydrateMessage(row) {
    return {
      id: row.id,
      conversationId: row.conversation_id,
      role: row.role,
      content: row.content,
      reasoning: row.reasoning,
      modelRef: row.model_ref,
      provider: row.provider,
      tokensIn: row.tokens_in,
      tokensOut: row.tokens_out,
      error: row.error,
      toolCalls: row.tool_calls ? ChatStore._parseJson(row.tool_calls) : null,
      variantGroup: row.variant_group || null,
      variantActive: row.variant_active == null ? true : !!row.variant_active,
      parentId: row.parent_id || null,
      createdAt: row.created_at,
    };
  }

  static _hydrateMeta(conversationId, row) {
    return {
      conversationId,
      mode: row.mode || ChatStore.DEFAULT_MODE,
      data: ChatStore._parseJson(row.data) || {},
      updatedAt: row.updated_at || null,
    };
  }

  static _patchedMessageRow(existing, patch) {
    const pick = (key, column) => (patch[key] !== undefined ? patch[key] : existing[column]);
    return {
      id: existing.id,
      content: pick('content', 'content'),
      reasoning: pick('reasoning', 'reasoning'),
      tokens_in: pick('tokensIn', 'tokens_in'),
      tokens_out: pick('tokensOut', 'tokens_out'),
      error: pick('error', 'error'),
      tool_calls: patch.toolCalls !== undefined ? ChatStore._serializeToolCalls(patch.toolCalls) : existing.tool_calls,
    };
  }

  static _serializeDisabledTools(names) {
    if (!Array.isArray(names)) return null;
    const clean = names.filter((n) => typeof n === 'string' && n.trim()).map((n) => n.trim());
    return clean.length ? JSON.stringify(clean) : null;
  }

  static _parseDisabledTools(text) {
    const value = text ? ChatStore._parseJson(text) : null;
    return Array.isArray(value) ? value : [];
  }

  static _serializeToolCalls(toolCalls) {
    return toolCalls != null ? JSON.stringify(toolCalls) : null;
  }

  static _parseJson(text) {
    return JsonColumn.parse(text, (raw) => ({ _raw: raw }));
  }

  static _toTriState(value) {
    if (value == null) return null;
    return value ? 1 : 0;
  }

  static _cleanTitle(title) {
    return (title && String(title).trim()) || ChatStore.DEFAULT_TITLE;
  }

  static _cleanMode(mode) {
    return (mode && String(mode).trim()) || ChatStore.DEFAULT_MODE;
  }

  static _isBlank(value) {
    return value === null || value === undefined || value === '';
  }

  static _now() {
    return new Date().toISOString();
  }
}

module.exports = ChatStore;
