import AboutPanel from './AboutPanel.js';
import AddonsBrowser from './AddonsBrowser.js';
import ChromeExtensionsPanel from './ChromeExtensionsPanel.js';
import ExtensionConfigView from './ExtensionConfigView.js';
import ExtensionFileActions from './ExtensionFileActions.js';
import ExtensionRow from './ExtensionRow.js';
import ExtensionsActionBar from './ExtensionsActionBar.js';
import ExtensionsListView from './ExtensionsListView.js';
import SettingsTabs from './SettingsTabs.js';
import TelemetryPanel from './TelemetryPanel.js';

export default class SettingsScreens {
  constructor({ meta, settingsEntries, host, hooks }) {
    this._meta = meta;
    this._entries = settingsEntries;
    this._host = host;
    this._hooks = hooks;
    this._tabs = new SettingsTabs({ onTab: (tab) => this._onTab(tab), onSubtab: (subtab) => this._loadSubtab(subtab) });
    this._screens = null;
  }

  init() {
    const panes = this._tabs.init();
    if (!panes) return;
    this._entries.setContainer(panes.extensions);
    this._screens = this._build(panes);
  }

  switchTab(tabName) {
    this._tabs.switchTab(tabName);
  }

  registerPage(extensionId, content, config = {}) {
    if (config.placement === 'tab' && this._tabs.hasStrip()) {
      const tabName = config.tabId || `ext-${extensionId}`;
      const section = this._tabs.addExtensionTab(tabName, config.label || extensionId);
      if (section) return this._entries.registerInSection(extensionId, content, config, section, tabName);
    }
    return this._entries.register(extensionId, content, config);
  }

  unregisterPage(extensionId) {
    const entry = this._entries.get(extensionId);
    if (entry && entry.tab) this._tabs.removeExtensionTab(entry.tab);
    this._entries.remove(extensionId);
  }

  tabOf(extensionId) {
    const entry = this._entries.get(extensionId);
    return entry && entry.tab ? entry.tab : null;
  }

  refreshListIfVisible() {
    if (this._screens) this._screens.list.refreshIfVisible();
  }

  async loadTelemetry() {
    if (this._screens) await this._screens.telemetry.load();
  }

  _build(panes) {
    const s = {};
    const showList = () => s.list.show();
    s.fileActions = new ExtensionFileActions({ meta: this._meta, host: this._host, hooks: this._hooks, onDeleted: showList });
    s.config = new ExtensionConfigView({
      pane: panes.extensions, meta: this._meta, settingsEntries: this._entries, hooks: this._hooks, fileActions: s.fileActions, onBack: showList,
      onOpenTab: (tabName) => this.switchTab(tabName),
    });
    s.addons = new AddonsBrowser({ pane: panes.extensions, hooks: this._hooks, onBack: showList });
    s.actionBar = new ExtensionsActionBar({
      meta: this._meta,
      hooks: this._hooks,
      onBrowseAddons: () => s.addons.show(),
      onNewExtension: () => s.fileActions.createNew(),
      onInstallZip: () => s.fileActions.installZip(),
    });
    const rowFactory = new ExtensionRow({
      meta: this._meta,
      host: this._host,
      onChanged: showList,
      onConfigure: (id) => s.config.show(id),
      onDelete: (id, name) => s.fileActions.delete(id, name),
    });
    s.list = new ExtensionsListView({ panes, meta: this._meta, rowFactory, onShown: () => s.actionBar.render() });
    s.chrome = new ChromeExtensionsPanel(panes.chrome);
    s.about = new AboutPanel(this._hooks);
    s.telemetry = new TelemetryPanel(panes.license, this._hooks);
    return s;
  }

  _onTab(tabName) {
    this._activateExtensionTab(tabName);
    if (!this._screens || !document.getElementById('settingsFooter')) return;
    if (tabName === 'extensions') this._screens.actionBar.render();
    else ExtensionsActionBar.clear();
  }

  _activateExtensionTab(tabName) {
    const entry = this._entries.byTab(tabName);
    if (!entry || !entry.onActivate) return;
    try { entry.onActivate(); } catch (e) { console.error('Extension onActivate error:', e); }
  }

  _loadSubtab(subtab) {
    const s = this._screens;
    if (!s) return;
    if (subtab === 'extensions' || subtab === 'inactiveExtensions') s.list.show();
    else if (subtab === 'chromeExtensions') s.chrome.load();
    else if (subtab === 'about') { if (window.electronAPI && window.electronAPI.getLicenses) s.about.load(); }
    else if (subtab === 'license') s.telemetry.load();
  }
}
