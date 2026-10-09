const CdpServer = require('./CdpServer');
const CdpDriverSettings = require('./CdpDriverSettings');
const LlmSelectorFallback = require('./LlmSelectorFallback');

class CdpDriverExtension {
  constructor() {
    this._context = null;
    this._settings = null;
    this._fallback = null;
    this._server = null;
  }

  async activate(context) {
    this._bindContext(context);
    const api = this._buildApi();
    this._registerIpc(context.ipc);
    CdpDriverExtension._bindMcpTools(api);
    await this._autostart();
    return api;
  }

  async deactivate() {
    try { await this.stop(); } catch (_) {}
    this._context = null;
    this._settings = null;
    this._fallback = null;
    this._server = null;
  }

  async start() {
    if (this._server && this._server.isRunning()) return { success: true, already: true, port: this._server.port() };
    const settings = this._settings.read();
    this._server = this._createServer(settings);
    try {
      const port = await this._server.start(settings.port, settings.host);
      return { success: true, port, host: settings.host };
    } catch (err) {
      this._server = null;
      return { success: false, error: err.message || 'failed to start' };
    }
  }

  async stop() {
    if (!this._server) return { success: true, already: true };
    await this._server.stop();
    this._server = null;
    return { success: true };
  }

  status() {
    const settings = this._settings.read();
    const server = this._server;
    return {
      running: !!(server && server.isRunning()),
      port: server ? server.port() : null,
      host: settings.host,
      browserUuid: server ? server.browserUuid : null,
      sessions: server ? server.activeSessions() : [],
      targets: server ? server.activeTargets() : [],
      settings,
    };
  }

  getSettings() {
    return this._settings.read();
  }

  setSettings(patch) {
    this._settings.write(patch || {});
    return this._settings.read();
  }

  _bindContext(context) {
    this._context = context;
    this._settings = new CdpDriverSettings(context.db.getRawDb());
    this._fallback = LlmSelectorFallback.createService(context);
  }

  _buildApi() {
    return {
      start: () => this.start(),
      stop: () => this.stop(),
      status: () => this.status(),
      getSettings: () => this.getSettings(),
      setSettings: (patch) => this.setSettings(patch),
    };
  }

  _registerIpc(ipc) {
    ipc.handle('start', async () => this.start());
    ipc.handle('stop', async () => this.stop());
    ipc.handle('status', async () => this.status());
    ipc.handle('settings.get', async () => this.getSettings());
    ipc.handle('settings.set', async (_e, patch) => this.setSettings(patch));
  }

  _createServer(settings) {
    return new CdpServer({ browser: this._context.browser, fallback: this._fallback, fallbackDefaults: settings.fallback });
  }

  async _autostart() {
    if (!this._settings.read().enabled) {
      console.log('cdp-driver: autostart disabled (cdp.enabled=false)');
      return;
    }
    const result = await this.start();
    if (!result.success) console.warn(`cdp-driver: autostart failed: ${result.error}`);
  }

  static _bindMcpTools(api) {
    try {
      const mcpTools = require('./mcp-tools.js');
      if (mcpTools && typeof mcpTools._bind === 'function') mcpTools._bind(api);
    } catch (err) {
      console.warn('cdp-driver: could not bind mcp-tools:', err.message);
    }
  }
}

module.exports = CdpDriverExtension;
