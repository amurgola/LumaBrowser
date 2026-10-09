const AgentDeps = require('./AgentDeps');

class HeavyServices {
  constructor(ctx, { browserService, log = console }) {
    this._ctx = ctx;
    this._s = ctx.services;
    this._browserService = browserService;
    this._log = log;
  }

  async run() {
    this._startGateway();
    await this._activateExtensions();
    this._ctx.agentDeps = this._buildAgentDeps();
    this._armBackgroundWork();
  }

  _startGateway() {
    if (!this._ctx.apiEnabled) {
      this._log.log('REST API server is disabled via settings');
      return null;
    }
    return this._s.restGateway.start()
      .then(() => this._onGatewayListening())
      .catch((error) => this._log.error('Failed to start REST server:', error));
  }

  _onGatewayListening() {
    const port = this._ctx.apiPort;
    this._log.log(`REST API server running on http://localhost:${port}`);
    try { this._s.cliHandshake.write(port); } catch (_) {}
    this._refreshInstalledBridges();
    try { this._s.llmServerService.notifyGatewayReady(); } catch (_) {}
    try { this._s.dashboardService.notifyGatewayReady(); } catch (_) {}
  }

  _refreshInstalledBridges() {
    if (this._ctx.isolatedDataDir) return;
    HeavyServices._quietly(() => this._s.cliShim.refreshIfInstalled(), (did) => { if (did) this._log.log('[cli-shim] refreshed the luma launcher'); });
    HeavyServices._quietly(() => this._s.idePlugin.refreshIfInstalled(), (ids) => {
      if (ids && ids.length) this._log.log(`[ide-plugin] refreshed the JetBrains plugin in ${ids.join(', ')}`);
    });
    HeavyServices._quietly(() => this._s.vscodeExtension.refreshIfInstalled(), (ids) => {
      if (ids && ids.length) this._log.log(`[ide-plugin] refreshed the VS Code extension in ${ids.join(', ')}`);
    });
  }

  async _activateExtensions() {
    const started = Date.now();
    try {
      await this._s.extensionManager.activate();
      this._ctx.boot.log(`extensionManager.activate done (took ${Date.now() - started}ms)`);
      this._log.log('All extensions activated');
    } catch (err) {
      this._log.error('Extension activation error:', err.message);
    }
  }

  _buildAgentDeps() {
    const s = this._s;
    return AgentDeps.build({
      browserService: this._browserService,
      artifactStore: s.artifactStore,
      artifactDataStore: s.artifactDataStore,
      artifactTaskStore: s.artifactTaskStore,
      mcpAggregator: s.mcpAggregator,
      ragService: s.ragService,
      db: s.db,
    });
  }

  _armBackgroundWork() {
    this._s.artifactTaskScheduler.start();
    this._s.scheduledTaskScheduler.start();
    try { this._s.fileWatchManager.reconcile(); } catch (_) {}
    try { this._s.pageChangeSource.ensureSubscribed(); } catch (_) {}
    try { this._s.notificationSource.ensureSubscribed(); } catch (_) {}
  }

  static _quietly(run, onDone) {
    return Promise.resolve().then(run).then(onDone).catch(() => {});
  }
}

module.exports = HeavyServices;
