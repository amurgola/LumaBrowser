import SettingToggle from './SettingToggle.js';
import RestartNotes from './RestartNotes.js';
import TelemetrySwitch from './TelemetrySwitch.js';
import CliShimSwitch from './CliShimSwitch.js';
import IdeInstallerList from './IdeInstallerList.js';
import LlmServerSettings from './LlmServerSettings.js';
import ApiPortSetting from './ApiPortSetting.js';
import EndpointToolsPanel from './EndpointToolsPanel.js';
import GuideViewer from './GuideViewer.js';
import CollapsibleSections from './CollapsibleSections.js';

export default class GeneralSettings {
  static API_DOCS_URL = 'https://lumabyte.com/apis';

  constructor({ feedback, settings, tabActions, cleaner }) {
    this._feedback = feedback;
    this._settings = settings;
    this._tabActions = tabActions;
    this._cleaner = cleaner;
    this._portInput = document.getElementById('gsApiPort');
    this._el = GeneralSettings._elements();
  }

  install() {
    if (!this._portInput) return false;
    this._buildParts();
    new RestartNotes({ feedback: this._feedback }).install();
    document.addEventListener('settings:open', () => this.load());
    for (const part of [this._port, this._telemetry, this._cliShim, this._jetbrains, this._vscode, this._llm, this._endpoints]) part.install();
    this._wireSwitches();
    this._wireButtons();
    new CollapsibleSections().install();
    return true;
  }

  async load() {
    this._cliShim.load();
    this._jetbrains.load();
    this._vscode.load();
    try {
      await this._port.load();
      this._el.apiEnabled.checked = await window.electronAPI.getApiEnabled();
      this._el.mcpEnabled.checked = await window.electronAPI.getMcpEnabled();
      await this._loadStartup();
      this._telemetry.load();
      await this._loadDns();
      try { this._el.adblocker.checked = await window.ipcBridge.invoke('core.adblocker.getEnabled'); } catch (e) {}
      await this._llm.load();
      RestartNotes.hideAll();
      await this._endpoints.load();
    } catch (e) {
      console.error('Failed to load general settings:', e);
    }
  }

  static _elements() {
    const $ = (id) => document.getElementById(id);
    return {
      apiEnabled: $('gsApiEnabled'),
      mcpEnabled: $('gsMcpEnabled'),
      runOnStartup: $('gsRunOnStartup'),
      startHidden: $('gsStartHidden'),
      startHiddenRow: $('gsStartHiddenRow'),
      adblocker: $('gsAdblockerEnabled'),
      dns: $('gsDnsProvider'),
      exportBtn: $('gsExportMcpConfig'),
      apiGuideBtn: $('gsViewApiGuide'),
      extGuideBtn: $('gsViewExtGuide'),
      clearHistoryBtn: $('gsClearHistoryBtn'),
      clearCacheBtn: $('gsClearCacheBtn'),
    };
  }

  _buildParts() {
    const feedback = this._feedback;
    this._port = new ApiPortSetting({ feedback, input: this._portInput });
    this._telemetry = new TelemetrySwitch({ feedback });
    this._cliShim = new CliShimSwitch({ feedback });
    this._jetbrains = new IdeInstallerList({ feedback, config: IdeInstallerList.JETBRAINS });
    this._vscode = new IdeInstallerList({ feedback, config: IdeInstallerList.VSCODE });
    this._llm = new LlmServerSettings({ feedback });
    this._endpoints = new EndpointToolsPanel({ feedback, settings: this._settings });
    this._guides = new GuideViewer({ feedback });
  }

  _wireSwitches() {
    const { apiEnabled, mcpEnabled, runOnStartup, startHidden, adblocker } = this._el;
    const api = window.electronAPI;
    SettingToggle.wire(apiEnabled, (v) => api.setApiEnabled(v), this._feedback, () => RestartNotes.show('gsApiRestartNote'));
    SettingToggle.wire(mcpEnabled, (v) => api.setMcpEnabled(v), this._feedback, () => RestartNotes.show('gsMcpRestartNote'));
    SettingToggle.wire(runOnStartup, (v) => api.setRunOnStartup(v), this._feedback, () => this._syncStartHiddenRow());
    SettingToggle.wire(startHidden, (v) => window.ipcBridge.invoke('core.settings.setStartHidden', v), this._feedback);
    SettingToggle.wire(adblocker, (v) => window.ipcBridge.invoke('core.adblocker.setEnabled', v), this._feedback);
    if (this._el.dns) this._el.dns.addEventListener('change', () => this._saveDns());
  }

  _wireButtons() {
    const { clearHistoryBtn, clearCacheBtn, exportBtn, apiGuideBtn, extGuideBtn } = this._el;
    if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', () => this._cleaner.clearHistory());
    if (clearCacheBtn) clearCacheBtn.addEventListener('click', () => this._cleaner.clearCache());
    exportBtn.addEventListener('click', () => this._exportMcpConfig());
    apiGuideBtn.addEventListener('click', () => {
      this._tabActions.create(GeneralSettings.API_DOCS_URL, { activate: true });
      this._settings.hideQuietly();
    });
    extGuideBtn.addEventListener('click', () => this._guides.show('extensions'));
  }

  _syncStartHiddenRow() {
    const { startHiddenRow, runOnStartup } = this._el;
    if (startHiddenRow) startHiddenRow.style.display = runOnStartup.checked ? 'flex' : 'none';
  }

  async _loadStartup() {
    const { runOnStartup, startHidden } = this._el;
    try {
      const st = await window.ipcBridge.invoke('core.settings.getStartupConfig');
      runOnStartup.checked = !!(st && st.openAtLogin);
      if (startHidden) startHidden.checked = !st || st.startHidden !== false;
    } catch (_) {
      runOnStartup.checked = await window.electronAPI.getRunOnStartup();
    }
    this._syncStartHiddenRow();
  }

  async _loadDns() {
    const dns = this._el.dns;
    if (!dns || !window.electronAPI.getDnsProvider) return;
    try { dns.value = (await window.electronAPI.getDnsProvider()) || 'default'; } catch (e) {}
  }

  async _saveDns() {
    const dns = this._el.dns;
    const result = await window.electronAPI.setDnsProvider(dns.value);
    if (result && result.success) { this._feedback.markSaved(dns, true); return; }
    this._feedback.markSaved(dns, false, (result && result.error) || 'Could not change the DNS provider');
    try { dns.value = (await window.electronAPI.getDnsProvider()) || 'default'; } catch (e) { dns.value = 'default'; }
  }

  async _exportMcpConfig() {
    const result = await window.electronAPI.exportMcpConfig();
    if (result.success) this._feedback.toast(`MCP config exported to ${result.filePath}`, 'ok');
    else if (result && !result.canceled) this._feedback.toast(result.error || 'Export failed', 'bad');
  }
}
