const path = require('path');
const IPCBridge = require('../../core/shell/IPCBridge');
const RestGateway = require('../../core/shell/RestGateway');
const McpAggregator = require('../../core/shell/McpAggregator');
const CliHandshake = require('../../core/shell/CliHandshake');
const CliShim = require('../../core/shell/CliShim');
const IdePluginInstaller = require('../../core/shell/IdePluginInstaller');
const VscodeExtensionInstaller = require('../../core/shell/VscodeExtensionInstaller');
const DashboardService = require('../../core/dashboard/DashboardService');
const AppGlobals = require('../AppGlobals');

class GatewayServices {
  static DEFAULT_PORT = 3000;
  static RAW_BODY_PREFIXES = ['/hooks'];

  constructor(ctx) {
    this._ctx = ctx;
    this._s = ctx.services;
    this._db = ctx.services.db;
  }

  build() {
    this._s.ipcBridge = new IPCBridge();
    this._resolveApiSettings();
    this._s.restGateway = new RestGateway(this._ctx.apiPort, { apiSecurity: this._s.apiSecurity, rawBodyPrefixes: GatewayServices.RAW_BODY_PREFIXES });
    this._buildTerminalAndIdeBridges();
    this._serveInAppPagesOverGateway();
    this._buildMcpAggregator();
    return this._s;
  }

  _resolveApiSettings() {
    this._ctx.apiPort = parseInt(this._ctx.env.LUMA_API_PORT, 10) || this._db.get('core.apiPort', GatewayServices.DEFAULT_PORT);
    this._ctx.apiEnabled = this._db.get('core.apiEnabled', true);
  }

  _buildTerminalAndIdeBridges() {
    const version = this._ctx.app.getVersion();
    this._s.cliHandshake = AppGlobals.publish('__lumaCliHandshake', new CliHandshake({ version }));
    this._s.cliShim = new CliShim({ exePath: this._ctx.env.APPIMAGE || this._ctx.proc.execPath, cliSource: this._resource('cli'), version });
    this._s.idePlugin = new IdePluginInstaller({ sourceDir: this._ideResource(IdePluginInstaller.PLUGIN_DIR_NAME), version });
    this._s.vscodeExtension = new VscodeExtensionInstaller({ vsixPath: this._ideResource(VscodeExtensionInstaller.VSIX_NAME), version });
  }

  _serveInAppPagesOverGateway() {
    this._s.dashboardService = new DashboardService({ settingsDb: this._db });
    if (!this._ctx.apiEnabled) return;
    this._s.llmServerService.setWebBaseUrl(this._ctx.gatewayOrigin());
    this._s.dashboardService.setWebBaseUrl(this._ctx.gatewayOrigin());
  }

  _buildMcpAggregator() {
    this._s.mcpAggregator = new McpAggregator();
    const disabled = this._db.get('core.disabledMcpTools', []);
    if (Array.isArray(disabled) && disabled.length > 0) this._s.mcpAggregator.setDisabledTools(disabled);
  }

  _resource(name) {
    return this._ctx.app.isPackaged ? path.join(this._ctx.proc.resourcesPath, name) : this._ctx.path(name);
  }

  _ideResource(name) {
    return this._ctx.app.isPackaged ? path.join(this._ctx.proc.resourcesPath, 'ide', name) : this._ctx.path('ide', 'dist', name);
  }
}

module.exports = GatewayServices;
