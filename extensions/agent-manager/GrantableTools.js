const AgentToolCatalog = require('../../core/llm-service/AgentToolCatalog');
const ExtensionGlobals = require('../../core/shell/extensions/ExtensionGlobals');

class GrantableTools {
  static OWN_GROUP = 'ext.agent-manager';

  static groups(router = ExtensionGlobals.chatRouter()) {
    const deps = (router && typeof router.getAgentDeps === 'function' && router.getAgentDeps()) || {};
    if (!deps.mcpAggregator) return [];
    return AgentToolCatalog.getToolGroups(deps.mcpAggregator).filter((g) => g.id !== GrantableTools.OWN_GROUP);
  }

  static availableNames(router = ExtensionGlobals.chatRouter()) {
    const names = new Set(AgentToolCatalog.BASE_TOOL_NAMES);
    for (const g of GrantableTools.groups(router)) for (const t of g.tools) names.add(t.name);
    return names;
  }
}

module.exports = GrantableTools;
