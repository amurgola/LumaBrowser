const path = require('path');
const ExtensionManager = require('../../core/shell/ExtensionManager');
const AddonModuleResolver = require('../../core/shell/extensions/AddonModuleResolver');

class ExtensionHost {
  static BUNDLED_DIR = 'extensions';

  constructor(ctx) {
    this._ctx = ctx;
    this._s = ctx.services;
  }

  build() {
    const extensionsDir = this._ctx.path(ExtensionHost.BUNDLED_DIR);
    const userExtensionsDir = path.join(this._ctx.dataDir, ExtensionHost.BUNDLED_DIR);
    new AddonModuleResolver({ addonsDir: userExtensionsDir, bundledDir: extensionsDir }).install();
    this._s.extensionManager = new ExtensionManager({
      extensionsDir,
      userExtensionsDir,
      coreServices: ExtensionHost.coreServices(this._s),
      ipcBridge: this._s.ipcBridge,
      restGateway: this._s.restGateway,
      mcpAggregator: this._s.mcpAggregator,
    });
    return this._s;
  }

  static coreServices(s) {
    return {
      database: s.db,
      llm: s.llmService,
      browser: null,
      identity: s.machineIdentity,
      chromeExtensions: s.chromeExtensionService,
      adblocker: s.adblockerService,
      networkWatcherService: s.networkWatcherService,
      networkInterceptor: s.networkInterceptor,
      activityLog: s.activityLogService,
      ttsServer: s.ttsServerService,
      sttServer: s.whisperServerService,
      apiSecurity: s.apiSecurity,
      get dashboard() { return s.dashboardService || null; },
    };
  }
}

module.exports = ExtensionHost;
