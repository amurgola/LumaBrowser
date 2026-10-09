const AgentToolCatalog = require('../../llm-service/AgentToolCatalog');

class EndpointSettings {
  static API_GROUPS_KEY = 'core.disabledApiGroups';
  static MCP_TOOLS_KEY = 'core.disabledMcpTools';
  static AGENT_TOOLS_KEY = AgentToolCatalog.DISABLED_TOOLS_KEY;
  static EXTENSION_PREFIX = 'ext.';

  constructor({ db, restGateway, mcpAggregator }) {
    this._db = db;
    this._rest = restGateway;
    this._mcp = mcpAggregator;
  }

  getAvailable() {
    return {
      apiGroups: this._rest.getRouteGroups(),
      mcpTools: this._mcp.getAvailableToolsList(),
      disabledApiGroups: this._db.get(EndpointSettings.API_GROUPS_KEY, []),
      disabledMcpTools: this._db.get(EndpointSettings.MCP_TOOLS_KEY, []),
      agentTools: AgentToolCatalog.getToolGroups(this._mcp),
      disabledAgentTools: this._db.get(EndpointSettings.AGENT_TOOLS_KEY, []),
    };
  }

  setConfig({ disabledApiGroups, disabledMcpTools, disabledAgentTools } = {}) {
    if (Array.isArray(disabledApiGroups)) this._applyApiGroups(disabledApiGroups);
    if (Array.isArray(disabledMcpTools)) this._applyMcpTools(disabledMcpTools);
    if (Array.isArray(disabledAgentTools)) this._db.set(EndpointSettings.AGENT_TOOLS_KEY, disabledAgentTools);
    return { success: true };
  }

  _applyApiGroups(disabled) {
    this._db.set(EndpointSettings.API_GROUPS_KEY, disabled);
    for (const group of this._rest.getRouteGroups()) {
      if (group.source !== 'extension') continue;
      const extensionId = group.id.replace(EndpointSettings.EXTENSION_PREFIX, '');
      if (disabled.includes(group.id)) this._rest.disableExtension(extensionId);
      else this._rest.enableExtension(extensionId);
    }
  }

  _applyMcpTools(disabled) {
    this._db.set(EndpointSettings.MCP_TOOLS_KEY, disabled);
    this._mcp.setDisabledTools(disabled);
  }
}

module.exports = EndpointSettings;
