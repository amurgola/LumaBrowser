const { ipcMain, app, dialog } = require('electron');
const OptionalServiceCall = require('./settings/OptionalServiceCall');
const ApiServerSettings = require('./settings/ApiServerSettings');
const OnboardingPersona = require('./settings/OnboardingPersona');
const AppPreferences = require('./settings/AppPreferences');
const StartupSettings = require('./settings/StartupSettings');
const McpServerEntry = require('./settings/McpServerEntry');
const AgentHarnessSettings = require('./settings/AgentHarnessSettings');
const SettingsGuides = require('./settings/SettingsGuides');
const EndpointSettings = require('./settings/EndpointSettings');
const SetupCompletion = require('./settings/SetupCompletion');
const WebhookTester = require('./settings/WebhookTester');
const ApiSecuritySettings = require('./settings/ApiSecuritySettings');

class SettingsIpcHandlers {
  static MCP_EXPORT_DIALOG = {
    title: 'Export MCP Configuration',
    defaultPath: 'luma-mcp-config.json',
    filters: [{ name: 'JSON', extensions: ['json'] }],
  };

  constructor({ db, restGateway, mcpAggregator, apiSecurity, mainWindowGetter, rootDir, onSetupFinalized = null, cliShim = null, idePlugin = null, vscodeExtension = null }) {
    this._db = db;
    this._mainWindow = mainWindowGetter || (() => null);
    this._rootDir = rootDir;
    this._integrations = { cliShim, idePlugin, vscodeExtension };
    this._api = new ApiServerSettings({ db, restGateway });
    this._preferences = new AppPreferences(db);
    this._startup = new StartupSettings({ db, app });
    this._harness = new AgentHarnessSettings({ db, mcpEntry: () => this._mcpEntry() });
    this._guides = new SettingsGuides(rootDir);
    this._endpoints = new EndpointSettings({ db, restGateway, mcpAggregator });
    this._setup = new SetupCompletion({ db, onSetupFinalized });
    this._webhook = new WebhookTester();
    this._security = new ApiSecuritySettings(apiSecurity);
  }

  register() {
    this._registerIntegrations();
    this._registerApiServer();
    this._registerPreferences();
    this._registerStartup();
    this._registerMcpAndHarness();
    this._registerSetup();
    this._registerEndpoints();
    this._registerApiSecurity();
  }

  _registerIntegrations() {
    const { cliShim, idePlugin, vscodeExtension } = this._integrations;
    const M = OptionalServiceCall.MESSAGES;
    const ids = OptionalServiceCall.ideIds;
    ipcMain.handle('core.settings.cliShim.status', () => OptionalServiceCall.run(cliShim, M.cliShim, (s) => s.status()));
    ipcMain.handle('core.settings.cliShim.install', () => OptionalServiceCall.run(cliShim, M.cliShim, (s) => s.install()));
    ipcMain.handle('core.settings.cliShim.uninstall', () => OptionalServiceCall.run(cliShim, M.cliShim, (s) => s.uninstall()));
    ipcMain.handle('core.settings.idePlugin.status', () => OptionalServiceCall.run(idePlugin, M.idePlugin, (s) => s.status()));
    ipcMain.handle('core.settings.idePlugin.install', (_e, list) => OptionalServiceCall.run(idePlugin, M.idePlugin, (s) => s.install(ids(list))));
    ipcMain.handle('core.settings.idePlugin.uninstall', (_e, list) => OptionalServiceCall.run(idePlugin, M.idePlugin, (s) => s.uninstall(ids(list))));
    ipcMain.handle('core.settings.vscodeExtension.status', () => OptionalServiceCall.run(vscodeExtension, M.vscodeExtension, (s) => s.status()));
    ipcMain.handle('core.settings.vscodeExtension.install', (_e, list) => OptionalServiceCall.run(vscodeExtension, M.vscodeExtension, (s) => s.install(ids(list))));
    ipcMain.handle('core.settings.vscodeExtension.uninstall', (_e, list) => OptionalServiceCall.run(vscodeExtension, M.vscodeExtension, (s) => s.uninstall(ids(list))));
  }

  _registerApiServer() {
    const api = this._api;
    ipcMain.handle('core.settings.getApiPort', () => api.getApiPort());
    ipcMain.handle('core.settings.getEffectiveApiPort', () => api.getEffectiveApiPort());
    ipcMain.handle('core.settings.setApiPort', (_e, port) => api.setApiPort(port));
    ipcMain.handle('core.settings.getApiEnabled', () => api.getApiEnabled());
    ipcMain.handle('core.settings.setApiEnabled', (_e, enabled) => api.setApiEnabled(enabled));
    ipcMain.handle('core.settings.getMcpEnabled', () => api.getMcpEnabled());
    ipcMain.handle('core.settings.setMcpEnabled', (_e, enabled) => api.setMcpEnabled(enabled));
  }

  _registerPreferences() {
    const prefs = this._preferences;
    ipcMain.handle('core.settings.getPersona', () => OnboardingPersona.get(this._db));
    ipcMain.handle('core.settings.setPersona', (_e, persona) => OnboardingPersona.set(this._db, persona));
    ipcMain.handle('core.settings.getAutoCheckUpdates', () => prefs.getAutoCheckUpdates());
    ipcMain.handle('core.settings.setAutoCheckUpdates', (_e, enabled) => prefs.setAutoCheckUpdates(enabled));
    ipcMain.handle('core.settings.getDnsProvider', () => prefs.getDnsProvider());
    ipcMain.handle('core.settings.setDnsProvider', (_e, provider) => prefs.setDnsProvider(provider));
    ipcMain.handle('core.settings.getShowBookmarksBar', () => prefs.getShowBookmarksBar());
    ipcMain.handle('core.settings.setShowBookmarksBar', (_e, show) => prefs.setShowBookmarksBar(show));
    ipcMain.handle('core.settings.getGuide', (_e, guideType) => this._guides.read(guideType));
  }

  _registerStartup() {
    const startup = this._startup;
    ipcMain.handle('core.settings.getRunOnStartup', () => startup.getRunOnStartup());
    ipcMain.handle('core.settings.setRunOnStartup', (_e, enabled) => startup.setRunOnStartup(enabled));
    ipcMain.handle('core.settings.getStartupConfig', () => startup.getConfig());
    ipcMain.handle('core.settings.setStartHidden', (_e, hidden) => startup.setStartHidden(hidden));
    ipcMain.handle('core.settings.relaunch', () => {
      app.relaunch();
      app.exit(0);
      return { success: true };
    });
  }

  _registerMcpAndHarness() {
    const harness = this._harness;
    ipcMain.handle('core.settings.exportMcpConfig', () => McpServerEntry.exportConfig(this._mcpEntry(), () => this._chooseMcpExportPath()));
    ipcMain.handle('core.settings.harness.list', () => harness.list());
    ipcMain.handle('core.settings.harness.connect', (_e, id) => harness.connect(id));
    ipcMain.handle('core.settings.harness.disconnect', (_e, id) => harness.disconnect(id));
    ipcMain.handle('core.settings.harness.writeSkills', () => harness.writeSkills());
  }

  _registerSetup() {
    const setup = this._setup;
    ipcMain.handle('core.settings.getSetupComplete', () => setup.get());
    ipcMain.handle('core.settings.setSetupComplete', (_e, payload) => setup.complete(payload));
    ipcMain.handle('core.settings.resetSetupComplete', () => setup.reset());
    ipcMain.handle('core.settings.setDisabledExtensions', (_e, ids) => setup.setDisabledExtensions(ids));
    ipcMain.handle('core.settings.setWebhookUrl', (_e, url) => setup.setWebhookUrl(url));
    ipcMain.handle('core.settings.testWebhook', (_e, url) => this._webhook.test(url));
  }

  _registerEndpoints() {
    ipcMain.handle('core.settings.getAvailableEndpoints', () => this._endpoints.getAvailable());
    ipcMain.handle('core.settings.setEndpointConfig', (_e, config) => this._endpoints.setConfig(config));
  }

  _registerApiSecurity() {
    const security = this._security;
    ipcMain.handle('core.settings.apiSecurity.get', () => security.getConfig());
    ipcMain.handle('core.settings.apiSecurity.revealKey', (_e, id) => security.revealKey(id));
    ipcMain.handle('core.settings.apiSecurity.setNetworkMode', (_e, mode) => security.setNetworkMode(mode));
    ipcMain.handle('core.settings.apiSecurity.setWhitelist', (_e, list) => security.setWhitelist(list));
    ipcMain.handle('core.settings.apiSecurity.setRequireApiKey', (_e, enabled) => security.setRequireApiKey(enabled));
    ipcMain.handle('core.settings.apiSecurity.createKey', (_e, label) => security.createKey(label));
    ipcMain.handle('core.settings.apiSecurity.updateKeyLabel', (_e, id, label) => security.updateKeyLabel(id, label));
    ipcMain.handle('core.settings.apiSecurity.refreshKey', (_e, id) => security.refreshKey(id));
    ipcMain.handle('core.settings.apiSecurity.deleteKey', (_e, id) => security.deleteKey(id));
  }

  _mcpEntry() {
    return McpServerEntry.build({ db: this._db, rootDir: this._rootDir, isPackaged: app.isPackaged });
  }

  _chooseMcpExportPath() {
    return dialog.showSaveDialog(this._mainWindow(), SettingsIpcHandlers.MCP_EXPORT_DIALOG);
  }
}

module.exports = SettingsIpcHandlers;
