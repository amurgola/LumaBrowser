const AgentToolCatalog = require('../../../llm-service/AgentToolCatalog');

class SetupChatToolPolicy {
  static ALWAYS_DENIED = ['schedule_artifact_updates'];

  constructor({ settingsDb = null, getRouter = () => null } = {}) {
    this._settingsDb = settingsDb;
    this._getRouter = getRouter;
  }

  denySet(conversationId) {
    const conversation = this._conversation(conversationId);
    const denied = new Set(this._settingsDb ? this._settingsDb.get(AgentToolCatalog.DISABLED_TOOLS_KEY, []) : []);
    for (const name of (conversation && conversation.disabledTools) || []) denied.add(name);
    for (const name of SetupChatToolPolicy.ALWAYS_DENIED) denied.add(name);
    return { conversation, denied };
  }

  runConfig(conversationId, deps) {
    const { conversation, denied } = this.denySet(conversationId);
    return { modelRef: (conversation && conversation.modelRef) || null, allowedTools: this._allowed(denied, deps) };
  }

  describe(conversationId, deps) {
    if (!deps) return null;
    const { denied } = this.denySet(conversationId);
    const descriptions = SetupChatToolPolicy._descriptions(deps.mcpAggregator);
    const groups = [];
    for (const group of AgentToolCatalog.getToolGroups(deps.mcpAggregator)) {
      const tools = group.tools
        .filter((tool) => !denied.has(tool.name))
        .map((tool) => ({ name: tool.name, label: tool.label || tool.name, description: descriptions.get(tool.name) || '' }));
      if (tools.length) groups.push({ id: group.id, label: group.label, description: group.description || '', tools });
    }
    return groups;
  }

  _conversation(conversationId) {
    const router = this._getRouter();
    const chatStore = router && router.chatStore;
    return chatStore && conversationId ? chatStore.getConversation(conversationId) : null;
  }

  _allowed(denied, deps) {
    try {
      return AgentToolCatalog.getAllToolNames(deps && deps.mcpAggregator).filter((name) => !denied.has(name));
    } catch (_) {
      return null;
    }
  }

  static _descriptions(mcpAggregator) {
    const descriptions = new Map();
    for (const tool of AgentToolCatalog.getDynamicTools(mcpAggregator)) descriptions.set(tool.name, tool.description || '');
    return descriptions;
  }
}

module.exports = SetupChatToolPolicy;
