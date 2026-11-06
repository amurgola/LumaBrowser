const AgentDeps = require('./AgentDeps');
const GatewayBinder = require('./GatewayBinder');
const PortConflict = require('./PortConflict');

class HeavyServices {
  static PORT_NOTICE_TITLE = 'Local API server could not start';
  static SETTINGS_TAB = 'apimcp';

  constructor(ctx, { browserService, log = console, inspectConflict = PortConflict.inspect, timers = {} }) {
    this._ctx = ctx;
    this._s = ctx.services;
    this._browserService = browserService;
    this._log = log;
    this._inspectConflict = inspectConflict;
    this._timers = timers;
    this._binder = null;
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
    this._binder = new GatewayBinder({
      gateway: this._s.restGateway,
      onListening: () => this._onGatewayListening(),
      onFirstFailure: (err) => this._onGatewayBindFailed(err),
      log: this._log,
      setTimeoutFn: this._timers.setTimeoutFn,
      clearTimeoutFn: this._timers.clearTimeoutFn,
    });
    return this._binder.start();
  }

  async _onGatewayBindFailed(err) {
    const port = this._ctx.apiPort;
    let conflict;
    try { conflict = await this._inspectConflict(port); } catch (_) { conflict = { kind: PortConflict.UNKNOWN, owner: null }; }
    this._s.restGateway.conflict = conflict;
    if (conflict.kind === PortConflict.LUMABROWSER) {
      await this._yieldToRunningInstance(port);
      return;
    }
    const holder = conflict.owner ? ` by ${conflict.owner}` : '';
    this._log.error(`REST API port ${port} is in use${holder} (${err && err.message ? err.message : err}); extension tabs, the Dashboard and the CLI need it. Retrying until it frees up; change the port in Settings > API & MCP otherwise.`);
    this._notifyPortInUse(port, conflict.owner);
  }

  async _yieldToRunningInstance(port) {
    this._log.error(`Another LumaBrowser already serves port ${port}; this copy exits (one LumaBrowser runs at a time).`);
    if (this._binder) this._binder.stop();
    const { app, dialog } = this._ctx.electron;
    if (this._canPrompt() && dialog && typeof dialog.showMessageBox === 'function') {
      try {
        await dialog.showMessageBox({
          type: 'info',
          title: 'LumaBrowser is already running',
          message: 'LumaBrowser is already running on this computer.',
          detail: `Another LumaBrowser is serving the local API on port ${port}. Only one copy can run at a time, so this one will close. Use the running copy, or quit it first.`,
          buttons: ['Close this copy'],
          noLink: true,
        });
      } catch (_) {}
    }
    app.quit();
  }

  _notifyPortInUse(port, owner) {
    const notice = this._ctx.desktopNotice;
    if (!notice || typeof notice.show !== 'function') return;
    const holder = owner ? ` by ${owner}` : ' by another program';
    notice.show({
      title: HeavyServices.PORT_NOTICE_TITLE,
      body: `Port ${port} is in use${holder}. Extension tabs, the Dashboard and the CLI need it. Open Settings > API & MCP to pick another port.`,
      onClick: () => this._openApiSettings(),
    });
  }

  _canPrompt() {
    return !this._ctx.env.LUMA_DOCKER && Boolean(this._ctx.liveWindow());
  }

  _openApiSettings() {
    const win = this._ctx.liveWindow();
    if (!win) return false;
    try {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
      win.webContents.send('tab-view:accelerator', { action: 'open-settings', settingsTab: HeavyServices.SETTINGS_TAB });
    } catch (_) { return false; }
    return true;
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
      vaultService: s.vaultService,
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
