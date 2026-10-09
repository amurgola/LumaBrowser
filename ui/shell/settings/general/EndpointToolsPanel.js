import ToolGroupsView from '../ToolGroupsView.js';
import SettingsFeedback from '../SettingsFeedback.js';
import ApiMcpGroups from './ApiMcpGroups.js';

export default class EndpointToolsPanel {
  constructor({ feedback, settings }) {
    this._feedback = feedback;
    this._settings = settings;
    this._apiMcpEl = document.getElementById('gsApiMcpTools');
    this._agentEl = document.getElementById('gsAgentTools');
    this._apiMcpGroups = [];
    this._apiMcpOn = new Set();
    this._agentGroups = [];
    this._agentOn = new Set();
  }

  install() {
    document.addEventListener('extension-toggled', () => {
      if (this._settings.isOpen()) this.load();
    });
  }

  async load() {
    try {
      const data = await window.electronAPI.getAvailableEndpoints();
      const { activeExtIds, extNames } = await EndpointToolsPanel._extensions();
      this._renderApiMcp(data, activeExtIds, extNames);
      this._renderAgent(data.agentTools, data.disabledAgentTools, activeExtIds);
    } catch (e) {
      console.error('Failed to load endpoints:', e);
    }
  }

  async save() {
    const { disabledApiGroups, disabledMcpTools } = ApiMcpGroups.disabled(this._apiMcpGroups, this._apiMcpOn);
    const disabledAgentTools = [];
    for (const g of this._agentGroups) for (const t of (g.tools || [])) {
      if (!this._agentOn.has(t.name)) disabledAgentTools.push(t.name);
    }
    try {
      await window.electronAPI.setEndpointConfig({ disabledApiGroups, disabledMcpTools, disabledAgentTools });
      this._flashSaved();
      document.dispatchEvent(new CustomEvent('agent-tools:changed', { detail: { disabledAgentTools } }));
    } catch (e) {
      this._feedback.toast(`Could not save endpoint settings: ${e.message}`, 'bad');
    }
  }

  static visibleAgentGroups(groups, activeExtIds) {
    return (groups || []).filter((g) => {
      if (!g.id || !g.id.startsWith('ext.')) return true;
      if (!activeExtIds) return true;
      return activeExtIds.has(g.id.replace('ext.', ''));
    });
  }

  static async _extensions() {
    let activeExtIds = new Set();
    const extNames = new Map();
    try {
      for (const ext of await window.ipcBridge.getExtensions()) {
        if (ext.enabled) activeExtIds.add(ext.id);
        if (ext.name) extNames.set(ext.id, ext.name);
      }
    } catch (e) { activeExtIds = null; }
    return { activeExtIds, extNames };
  }

  _renderApiMcp(data, activeExtIds, extNames) {
    if (!this._apiMcpEl) return;
    const { groups, on } = ApiMcpGroups.build(data, activeExtIds, extNames);
    this._apiMcpGroups = groups;
    this._apiMcpOn = on;
    ToolGroupsView.render(this._apiMcpEl, groups, on, {
      emptyText: 'No API routes or MCP tools registered',
      onChange: () => this.save(),
    });
  }

  _renderAgent(groups, disabled, activeExtIds) {
    if (!this._agentEl) return;
    const disabledSet = new Set(Array.isArray(disabled) ? disabled : []);
    this._agentGroups = EndpointToolsPanel.visibleAgentGroups(groups, activeExtIds);
    this._agentOn = new Set();
    for (const g of this._agentGroups) for (const t of (g.tools || [])) if (!disabledSet.has(t.name)) this._agentOn.add(t.name);
    ToolGroupsView.render(this._agentEl, this._agentGroups, this._agentOn, {
      emptyText: 'No agent tools available',
      onChange: () => this.save(),
    });
  }

  _flashSaved() {
    const anchor = this._agentEl && this._agentEl.closest('.gs-body');
    if (!anchor) return;
    let badge = anchor.querySelector(':scope > .gs-saved');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'gs-saved';
      badge.style.cssText = 'position:sticky;bottom:6px;float:right;';
      anchor.appendChild(badge);
    }
    SettingsFeedback.flashBadge(badge, true);
  }
}
