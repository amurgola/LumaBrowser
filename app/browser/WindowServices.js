const path = require('path');
const TabSurfaces = require('./TabSurfaces');
const HistoryRecorder = require('./HistoryRecorder');
const AutomationServices = require('./AutomationServices');
const CoreMcpTools = require('./CoreMcpTools');
const StaticUiRoutes = require('../gateway/StaticUiRoutes');
const ArtifactRoutes = require('../gateway/ArtifactRoutes');
const HeavyServices = require('../ready/HeavyServices');

class WindowServices {
  constructor(ctx, { log = console } = {}) {
    this._ctx = ctx;
    this._s = ctx.services;
    this._log = log;
  }

  wire(win) {
    new TabSurfaces(this._ctx, { log: this._log }).build(win);
    new HistoryRecorder({ tabViewManager: this._ctx.tabViewManager, historyService: this._s.historyService }).attach();
    const automation = new AutomationServices(this._ctx).build(win);
    this._mountGatewayPages();
    new CoreMcpTools(this._ctx).register(automation);
    this._discoverExtensions(automation.browserService);
    this._ctx.heavyServices = new HeavyServices(this._ctx, { browserService: automation.browserService, log: this._log });
    this._ctx.boot.log('createWindow: heavy services starter exposed (invoked by startDeferredServices)');
  }

  _mountGatewayPages() {
    const app = this._s.restGateway.getApp();
    const guard = this._s.apiSecurity.middleware();
    new StaticUiRoutes({ app, guard, rootDir: this._ctx.rootDir, extensionManager: this._s.extensionManager }).mount();
    new ArtifactRoutes({
      app,
      guard,
      artifactsDir: path.join(this._ctx.dataDir, 'artifacts'),
      artifactDataStore: this._s.artifactDataStore,
      liveApi: this._s.liveApi,
    }).mount();
  }

  _discoverExtensions(browserService) {
    const manager = this._s.extensionManager;
    manager.coreServices.browser = browserService;
    this._ctx.boot.log('extensionManager.discover start');
    manager.discover();
    this._ctx.boot.log('extensionManager.discover done');
    manager.resolve();
    this._ctx.boot.log('extensionManager.resolve done');
  }
}

module.exports = WindowServices;
