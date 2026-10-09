const McpToolNaming = require('./McpToolNaming');

class McpToolRegistry {
  static RETRY_MS = 1500;

  constructor({ getAggregator, getConnections, handler }) {
    this._getAggregator = getAggregator;
    this._getConnections = getConnections;
    this._handler = handler;
    this._routes = new Map();
    this._retry = null;
  }

  sync() {
    const aggregator = this._getAggregator();
    if (!aggregator) return this._retryLater();
    const { tools, routes } = this._collect();
    this._routes = routes;
    if (tools.length) aggregator.registerExtension(McpToolNaming.EXTENSION_ID, { tools, handler: this._handler });
    else aggregator.unregisterExtension(McpToolNaming.EXTENSION_ID);
  }

  route(toolName) {
    return this._routes.get(toolName) || null;
  }

  _collect() {
    const tools = [];
    const routes = new Map();
    const taken = new Set();
    for (const [serverId, entry] of this._getConnections()) {
      if (entry.status !== 'connected') continue;
      for (const tool of entry.tools) {
        const name = McpToolNaming.makeToolName(entry.slug, tool.name, taken);
        tools.push(McpToolRegistry._definition(name, entry.slug, tool));
        routes.set(name, { serverId, originalName: tool.name });
      }
    }
    return { tools, routes };
  }

  _retryLater() {
    if (this._retry) return;
    this._retry = setTimeout(() => { this._retry = null; this.sync(); }, McpToolRegistry.RETRY_MS);
    if (this._retry.unref) this._retry.unref();
  }

  static _definition(name, slug, tool) {
    return {
      name,
      description: `[${slug}] ${tool.description || tool.name}`,
      inputSchema: tool.inputSchema || { type: 'object', properties: {} },
    };
  }
}

module.exports = McpToolRegistry;
