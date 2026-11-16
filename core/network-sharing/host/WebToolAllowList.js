const AgentToolCatalog = require('../../llm-service/AgentToolCatalog');

class WebToolAllowList {
  static WITHHELD_BY_DEFAULT_GROUPS = ['vault', 'programmatic'];

  constructor({ settings, mcpAggregator }) {
    this._settings = settings;
    this._mcpAggregator = mcpAggregator || null;
  }

  defaults() {
    return AgentToolCatalog.BASE_TOOL_GROUPS
      .filter((group) => !WebToolAllowList.WITHHELD_BY_DEFAULT_GROUPS.includes(group.id))
      .flatMap((group) => group.tools.map((tool) => tool.name));
  }

  forSharedTurn() {
    const switchedOff = new Set(this._settings.getGloballyDisabledTools());
    return (this.get() || this.defaults()).filter((name) => !switchedOff.has(name));
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
