const AgentToolCatalog = require('../../llm-service/AgentToolCatalog');

class WebToolAllowList {
  constructor({ settings, mcpAggregator }) {
    this._settings = settings;
    this._mcpAggregator = mcpAggregator || null;
  }

  get() {
    const raw = this._settings.getWebAllowedTools();
    if (!Array.isArray(raw)) return null;
    const known = this._knownNames();
    return raw.filter((name) => known.includes(name));
  }

  set(tools) {
    if (!Array.isArray(tools)) {
      this._settings.setWebAllowedTools(null);
      return { success: true, webAllowedTools: null };
    }
    const cleaned = this._knownNames().filter((name) => tools.includes(name));
    this._settings.setWebAllowedTools(cleaned);
    return { success: true, webAllowedTools: cleaned };
  }

  toolGroups() {
    return AgentToolCatalog.getToolGroups(this._mcpAggregator);
  }

  _knownNames() {
    return AgentToolCatalog.getAllToolNames(this._mcpAggregator);
  }
}

module.exports = WebToolAllowList;
