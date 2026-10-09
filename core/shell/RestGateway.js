const express = require('express');
const cors = require('cors');
const ExtensionRouteTable = require('./rest-gateway/ExtensionRouteTable');
const UpgradeRouter = require('./rest-gateway/UpgradeRouter');
const McpProxyRoutes = require('./rest-gateway/McpProxyRoutes');
const HealthRoutes = require('./rest-gateway/HealthRoutes');

class RestGateway {
  static JSON_LIMIT = '50mb';
  static HOST = '0.0.0.0';

  constructor(port = 3000, options = {}) {
    this.port = port;
    this.app = express();
    this.server = null;
    this._apiSecurity = options.apiSecurity || null;
    this._rawBodyPrefixes = Array.isArray(options.rawBodyPrefixes) ? options.rawBodyPrefixes.slice() : [];
    this._routes = new ExtensionRouteTable();
    this._upgrades = new UpgradeRouter({ isDisabled: (id) => this._routes.isDisabled(id) });
    this._mcpAggregator = null;
    this._setupMiddleware();
  }

  mountCore(prefix, router) {
    this.app.use(prefix, router);
    console.log(`RestGateway: mounted core routes at ${prefix}`);
  }

  registerExtension(extensionId, routeFactoryOrConfig, context) {
    try {
      const { factory, prefix } = RestGateway._routeConfig(extensionId, routeFactoryOrConfig);
      const router = RestGateway._resolveRouter(factory, context);
      this.app.use(prefix, this._routes.gate(extensionId, router));
      this._routes.record(extensionId, router, prefix);
      console.log(`RestGateway: mounted extension routes at ${prefix}`);
    } catch (err) {
      console.error(`RestGateway: failed to register routes for "${extensionId}":`, err.message);
    }
  }

  mountExposedRoutes(extensionId, router) {
    try {
      const prefix = this._routes.prefixOf(extensionId);
      this.app.use(prefix, this._routes.gate(extensionId, router));
      console.log(`RestGateway: mounted exposed routes for "${extensionId}" at ${prefix}`);
    } catch (err) {
      console.error(`RestGateway: failed to mount exposed routes for "${extensionId}":`, err.message);
    }
  }

  disableExtension(extensionId) {
    this._routes.disable(extensionId);
    console.log(`RestGateway: disabled routes for "${extensionId}"`);
  }

  enableExtension(extensionId) {
    this._routes.enable(extensionId);
    console.log(`RestGateway: enabled routes for "${extensionId}"`);
  }

  mountMcpProxy(mcpAggregator) {
    this._mcpAggregator = mcpAggregator;
    this.app.use('/api/mcp', McpProxyRoutes.create(mcpAggregator));
    console.log('RestGateway: mounted MCP proxy endpoints at /api/mcp/');
  }

  mountHealthEndpoints() {
    this.app.use('/api', HealthRoutes.create(() => this._healthState()));
  }

  getRouteGroups() {
    const core = { id: 'core.browser', label: 'Browser API', prefix: '/api/browser', source: 'core' };
    const extensions = this._routes.prefixes().map(({ id, prefix }) => ({ id: `ext.${id}`, label: id, prefix, source: 'extension' }));
    return [core, ...extensions];
  }

  registerExtensionUpgrade(extensionId, suffix, handler) {
    const prefix = this._upgrades.register(extensionId, suffix, handler);
    console.log(`RestGateway: registered upgrade handler at ${prefix}`);
  }

  removeExtensionUpgrades(extensionId) {
    this._upgrades.removeExtension(extensionId);
  }

  start() {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, RestGateway.HOST, () => {
        console.log(`RestGateway: HTTP server listening on port ${this.port}`);
        resolve();
      });
      this.server.on('upgrade', (req, socket, head) => this._upgrades.dispatch(req, socket, head));
      this.server.on('error', (err) => {
        console.error('RestGateway: failed to start:', err.message);
        reject(err);
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }
      const server = this.server;
      this.server = null;
      server.close(resolve);
      if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
    });
  }

  getApp() {
    return this.app;
  }

  _setupMiddleware() {
    this.app.use(cors());
    this._installBodyParsers();
    if (this._apiSecurity) this.app.use('/api', this._apiSecurity.middleware());
  }

  _installBodyParsers() {
    const jsonParser = express.json({ limit: RestGateway.JSON_LIMIT });
    const formParser = express.urlencoded({ extended: true });
    this.app.use((req, res, next) => (this._isRawBody(req) ? next() : jsonParser(req, res, next)));
    this.app.use((req, res, next) => (this._isRawBody(req) ? next() : formParser(req, res, next)));
  }

  _isRawBody(req) {
    return this._rawBodyPrefixes.some((p) => req.path === p || req.path.startsWith(`${p}/`));
  }

  _healthState() {
    return { port: this.port, mcpEnabled: !!this._mcpAggregator, extensions: this._routes.prefixes() };
  }

  static _routeConfig(extensionId, routeFactoryOrConfig) {
    const isConfig = routeFactoryOrConfig && typeof routeFactoryOrConfig === 'object' && !routeFactoryOrConfig.handle;
    const factory = isConfig ? (routeFactoryOrConfig.factory || routeFactoryOrConfig) : routeFactoryOrConfig;
    const customPrefix = isConfig ? routeFactoryOrConfig.prefix : null;
    return { factory, prefix: customPrefix || ExtensionRouteTable.defaultPrefix(extensionId) };
  }

  static _resolveRouter(factory, context) {
    if (typeof factory === 'function' && !factory.handle) return factory(context);
    return factory;
  }
}

module.exports = RestGateway;
