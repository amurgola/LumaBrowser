import ToolGroupsView from '../ToolGroupsView.js';

export default class SharingWebTools {
  constructor({ sharingApi, feedback }) {
    this._api = sharingApi;
    this._feedback = feedback;
    this._wrap = document.getElementById('gsShareWebTools');
    this._groups = [];
    this._allowed = new Set();
    this._expanded = new Set();
    this._globallyDisabled = new Set();
  }

  install() {
    document.addEventListener('agent-tools:changed', (e) => {
      this._globallyDisabled = new Set((e.detail && e.detail.disabledAgentTools) || []);
      this.draw();
    });
  }

  async refreshGloballyDisabled() {
    try {
      const d = await window.electronAPI.getAvailableEndpoints();
      this._globallyDisabled = new Set(Array.isArray(d && d.disabledAgentTools) ? d.disabledAgentTools : []);
    } catch (_) {}
  }

  render(cfg) {
    if (!this._wrap) return;
    this._groups = Array.isArray(cfg.toolGroups) ? cfg.toolGroups : [];
    this._allowed = Array.isArray(cfg.webAllowedTools) ? new Set(cfg.webAllowedTools) : new Set(this._allNames());
    this.draw();
  }

  draw() {
    if (!this._wrap) return;
    ToolGroupsView.render(this._wrap, SharingWebTools.visibleGroups(this._groups, this._globallyDisabled), this._allowed, {
      expanded: this._expanded,
      emptyText: 'No tools are available to web clients. Enable some under API & MCP first.',
      onChange: () => this._persist(),
    });
  }

  static visibleGroups(groups, globallyDisabled) {
    return groups
      .map((g) => ({ ...g, tools: (g.tools || []).filter((t) => !globallyDisabled.has(t.name)) }))
      .filter((g) => g.tools.length > 0);
  }

  static payload(names, allowed) {
    const allOn = names.length > 0 && names.every((n) => allowed.has(n));
    return allOn ? null : [...allowed];
  }

  _allNames() {
    return this._groups.reduce((acc, g) => acc.concat(g.tools.map((t) => t.name)), []);
  }

  _persist() {
    this._api.setWebAllowedTools(SharingWebTools.payload(this._allNames(), this._allowed))
      .then(() => this._feedback.markSaved(this._wrap, true))
      .catch((e) => this._feedback.markSaved(this._wrap, false, e.message));
  }
}
