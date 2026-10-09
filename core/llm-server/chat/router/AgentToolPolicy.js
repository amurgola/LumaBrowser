const AgentToolCatalog = require('../../../llm-service/AgentToolCatalog');

class AgentToolPolicy {
  static DISABLED_SETTING = 'core.chat.disabledAgentTools';

  constructor({ db, chatStore, getAgentDeps }) {
    this._db = db;
    this._chatStore = chatStore;
    this._getAgentDeps = getAgentDeps;
  }

  allowedFor(conversationId, deps = null) {
    try {
      const disabled = new Set(this._globalDisabled());
      for (const name of this._conversationDisabled(conversationId)) disabled.add(name);
      if (!disabled.size) return null;
      return this._catalogNames(deps).filter((name) => !disabled.has(name));
    } catch (_) {
      return null;
    }
  }

  globalAllowList(deps) {
    try {
      const disabled = this._globalDisabled();
      if (!disabled.length) return null;
      const set = new Set(disabled);
      return AgentToolCatalog.getAllToolNames(deps && deps.mcpAggregator).filter((name) => !set.has(name));
    } catch (_) {
      return null;
    }
  }

  catalog() {
    const deps = this._deps();
    return {
      success: true,
      groups: AgentToolCatalog.getToolGroups(deps && deps.mcpAggregator),
      disabled: this._safeGlobalDisabled(),
    };
  }

  setGlobalEnabled(name, enabled) {
    if (!name || typeof name !== 'string') return { success: false, error: 'tool name required' };
    if (!this._isOptInTool(name)) {
      return { success: false, error: `Tool "${name}" cannot be toggled through this channel.` };
    }
    const set = new Set(this._safeGlobalDisabled());
    if (enabled) set.delete(name); else set.add(name);
    try {
      if (this._db) this._db.set(AgentToolPolicy.DISABLED_SETTING, [...set]);
    } catch (err) {
      return { success: false, error: err.message };
    }
    return { success: true, disabled: [...set] };
  }

  _isOptInTool(name) {
    const deps = this._deps();
    const groups = AgentToolCatalog.getToolGroups(deps && deps.mcpAggregator);
    const entry = groups.flatMap((g) => g.tools || []).find((t) => t.name === name);
    return !!(entry && entry.surfaceWhenDisabled);
  }

  _catalogNames(deps) {
    const d = deps || this._deps() || {};
    return AgentToolCatalog.getAllToolNames(d.mcpAggregator || null);
  }

  _globalDisabled() {
    return this._db ? this._db.get(AgentToolPolicy.DISABLED_SETTING, []) : [];
  }

  _safeGlobalDisabled() {
    try {
      const list = this._globalDisabled();
      return Array.isArray(list) ? list.slice() : [];
    } catch (_) {
      return [];
    }
  }

  _conversationDisabled(conversationId) {
    try {
      const conv = conversationId && this._chatStore ? this._chatStore.getConversation(conversationId) : null;
      return (conv && conv.disabledTools) || [];
    } catch (_) {
      return [];
    }
  }

  _deps() {
    return this._getAgentDeps ? this._getAgentDeps() : null;
  }
}

module.exports = AgentToolPolicy;
