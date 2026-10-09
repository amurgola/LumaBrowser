const express = require('express');

class HealthRoutes {
  static CORE_ROUTES = ['/api/health', '/api/browser'];
  static MCP_ROUTES = ['/api/mcp/tools', '/api/mcp/call'];

  static create(readState) {
    const router = express.Router();
    router.get('/health', (req, res) => res.json(HealthRoutes._health(readState())));
    router.get('/', (req, res) => res.json(HealthRoutes._index(readState())));
    return router;
  }

  static _health({ port, mcpEnabled, extensions }) {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      port,
      mcpEnabled,
      extensions: extensions.map((e) => e.id),
    };
  }

  static _index({ port, mcpEnabled, extensions }) {
    const core = mcpEnabled ? [...HealthRoutes.CORE_ROUTES, ...HealthRoutes.MCP_ROUTES] : [...HealthRoutes.CORE_ROUTES];
    const byId = Object.fromEntries(extensions.map((e) => [e.id, e.prefix]));
    return { name: 'LumaBrowser API', port, mcpEnabled, routes: { core, extensions: byId } };
  }
}

module.exports = HealthRoutes;
