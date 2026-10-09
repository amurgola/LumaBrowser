const path = require('path');
const ExtensionManager = require('../../core/shell/ExtensionManager');

class ExtensionHost {
  static BUNDLED_DIR = 'extensions';

  constructor(ctx) {
    this._ctx = ctx;
    this._s = ctx.services;
  }

  build() {
    this._s.extensionManager = new ExtensionManager({
      extensionsDir: this._ctx.path(ExtensionHost.BUNDLED_DIR),
      userExtensionsDir: path.join(this._ctx.dataDir, ExtensionHost.BUNDLED_DIR),
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
    };
  }
}

module.exports = ExtensionHost;
