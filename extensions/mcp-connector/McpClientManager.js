const McpTransportFactory = require('./McpTransportFactory');
const McpToolRegistry = require('./McpToolRegistry');
const McpToolNaming = require('./McpToolNaming');
const PromiseTimeout = require('./PromiseTimeout');
const ChatRouterDeps = require('./ChatRouterDeps');

class McpClientManager {
  static CONNECT_TIMEOUT_MS = 30000;
  static CALL_TIMEOUT_MS = 120000;

  constructor({ store, logger, transportFactory, createClient, getAggregator } = {}) {
    this._store = store;
    this._logger = logger || null;
    this._transports = transportFactory || new McpTransportFactory();
    this._createClient = createClient || McpClientManager._sdkClient;
    this._connections = new Map();
    this._registry = new McpToolRegistry({
      getAggregator: getAggregator || (() => ChatRouterDeps.aggregator()),
      getConnections: () => this._connections,
      handler: (toolName, args) => this.callTool(toolName, args),
    });
  }

  async connect(config) {
    await this.disconnect(config.id);
    const entry = McpClientManager._newEntry(config);
    this._connections.set(config.id, entry);
    await this._dial(config, entry);
    this._registry.sync();
    return { status: entry.status, error: entry.error, toolCount: entry.tools.length };
  }

  async disconnect(serverId) {
    const entry = this._connections.get(serverId);
    if (!entry) return;
    this._connections.delete(serverId);
    await McpClientManager._close(entry.client);
    this._registry.sync();
  }

  async reconnectAll() {
    for (const config of this._configs()) {
      if (config.enabled === false) continue;
      await this.connect(config);
    }
  }

  async disconnectAll() {
    for (const id of Array.from(this._connections.keys())) await this.disconnect(id);
  }

  status() {
    return this._configs().map((config) => this._statusRow(config));
  }

  async callTool(toolName, args) {
    const route = this._registry.route(toolName);
    if (!route) throw new Error(`mcp-connector: unknown tool "${toolName}"`);
    const entry = this._connections.get(route.serverId);
    if (!entry || entry.status !== 'connected' || !entry.client) {
      throw new Error(`mcp-connector: server for "${toolName}" is not connected`);
    }
    return entry.client.callTool(
      { name: route.originalName, arguments: args || {} },
      undefined,
      { timeout: McpClientManager.CALL_TIMEOUT_MS },
    );
  }

  async _dial(config, entry) {
    try {
      const transport = this._transports.build(config);
      const client = this._createClient();
      await PromiseTimeout.wrap(client.connect(transport), McpClientManager.CONNECT_TIMEOUT_MS, `Connecting to "${config.name}"`);
      const listed = await PromiseTimeout.wrap(client.listTools(), McpClientManager.CONNECT_TIMEOUT_MS, `Listing tools for "${config.name}"`);
      McpClientManager._markConnected(entry, client, transport, listed);
      this._log('info', `Connected to "${config.name}": ${entry.tools.length} tool(s)`);
    } catch (error) {
      entry.status = 'error';
      entry.error = (error && error.message) || String(error);
      this._log('warn', `Failed to connect to "${config.name}": ${entry.error}`);
    }
  }

  _configs() {
    return (this._store && this._store.list()) || [];
  }

  _statusRow(config) {
    const connection = this._connections.get(config.id);
    return {
      id: config.id,
      name: config.name,
      transport: config.transport,
      enabled: config.enabled !== false,
      status: connection ? connection.status : (config.enabled === false ? 'disabled' : 'idle'),
      error: connection ? connection.error : null,
      tools: connection ? connection.tools.map((tool) => ({ name: tool.name, description: tool.description || '' })) : [],
    };
  }

  _log(level, message) {
    if (this._logger && typeof this._logger[level] === 'function') this._logger[level](message);
    else console.log(`[${McpToolNaming.EXTENSION_ID}] ${message}`);
  }

  static _newEntry(config) {
    const slug = McpToolNaming.slugify(config.name);
    return { client: null, transport: null, tools: [], slug, status: 'connecting', error: null, connectedAt: null };
  }

  static _markConnected(entry, client, transport, listed) {
    entry.client = client;
    entry.transport = transport;
    entry.tools = Array.isArray(listed && listed.tools) ? listed.tools : [];
    entry.status = 'connected';
    entry.connectedAt = Date.now();
  }

  static async _close(client) {
    if (!client) return;
    try { await client.close(); } catch (_) {}
  }

  static _sdkClient() {
    const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
    return new Client({ name: 'LumaBrowser', version: '1.0.0' }, { capabilities: {} });
  }
}

module.exports = McpClientManager;
