class ApiServerSettings {
  static PORT_KEY = 'core.apiPort';
  static API_ENABLED_KEY = 'core.apiEnabled';
  static MCP_ENABLED_KEY = 'core.mcpEnabled';
  static DEFAULT_PORT = 3000;
  static MIN_PORT = 1024;
  static MAX_PORT = 65535;
  static PORT_ERROR = 'Port must be between 1024 and 65535';

  constructor({ db, restGateway = null, env = process.env }) {
    this._db = db;
    this._restGateway = restGateway;
    this._env = env;
  }

  getApiPort() {
    return this._db.get(ApiServerSettings.PORT_KEY, ApiServerSettings.DEFAULT_PORT);
  }

  getEffectiveApiPort() {
    const live = this._restGateway && this._restGateway.port;
    return live || parseInt(this._env.LUMA_API_PORT, 10) || this.getApiPort();
  }

  setApiPort(port) {
    const value = parseInt(port, 10);
    if (isNaN(value) || value < ApiServerSettings.MIN_PORT || value > ApiServerSettings.MAX_PORT) {
      return { success: false, error: ApiServerSettings.PORT_ERROR };
    }
    this._db.set(ApiServerSettings.PORT_KEY, value);
    return { success: true, requiresRestart: true };
  }

  getApiEnabled() {
    return this._db.get(ApiServerSettings.API_ENABLED_KEY, true);
  }

  setApiEnabled(enabled) {
    return this._setRestartFlag(ApiServerSettings.API_ENABLED_KEY, enabled);
  }

  getMcpEnabled() {
    return this._db.get(ApiServerSettings.MCP_ENABLED_KEY, true);
  }

  setMcpEnabled(enabled) {
    return this._setRestartFlag(ApiServerSettings.MCP_ENABLED_KEY, enabled);
  }

  _setRestartFlag(key, enabled) {
    this._db.set(key, !!enabled);
    return { success: true, requiresRestart: true };
  }
}

module.exports = ApiServerSettings;
