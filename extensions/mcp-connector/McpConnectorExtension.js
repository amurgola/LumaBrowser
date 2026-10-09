const McpServerStore = require('./McpServerStore');
const McpClientManager = require('./McpClientManager');
const McpServerService = require('./McpServerService');
const McpSetupActions = require('./McpSetupActions');

class McpConnectorExtension {
  constructor() {
    this._manager = null;
    this._service = null;
  }

  async activate(context) {
    this._buildServices(context);
    this._registerSetupTab(context);
    this._reconnectInBackground(context.logger);
    McpConnectorExtension._log(context.logger, 'info', 'MCP Connector activated');
    return this._api();
  }

  async deactivate() {
    if (this._manager) await this._manager.disconnectAll();
    this._manager = null;
    this._service = null;
  }

  _buildServices(context) {
    const store = new McpServerStore(context.db.getRawDb());
    this._manager = new McpClientManager({ store, logger: context.logger || null });
    this._service = new McpServerService({ store, manager: this._manager });
  }

  _registerSetupTab(context) {
    if (!context.setupTab || typeof context.setupTab.onInvoke !== 'function') return;
    const actions = new McpSetupActions({ getService: () => this._service });
    context.setupTab.onInvoke((action, payload) => actions.invoke(action, payload));
  }

  _reconnectInBackground(logger) {
    const manager = this._manager;
    Promise.resolve().then(() => manager.reconnectAll()).catch((error) => {
      McpConnectorExtension._log(logger, 'warn', `reconnectAll failed: ${error.message}`);
    });
  }

  _api() {
    return {
      getStore: () => (this._service ? this._service.store : null),
      getManager: () => this._manager,
      getService: () => this._service,
      status: () => this._service.rows(),
    };
  }

  static _log(logger, level, message) {
    if (logger && typeof logger[level] === 'function') logger[level](message);
  }
}

module.exports = McpConnectorExtension;
