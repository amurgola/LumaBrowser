const express = require('express');
const McpResult = require('../McpResult');

class McpProxyRoutes {
  static create(mcpAggregator) {
    const router = express.Router();
    router.get('/tools', (req, res) => McpProxyRoutes._listTools(mcpAggregator, res));
    router.post('/call', (req, res) => McpProxyRoutes._callTool(mcpAggregator, req, res));
    return router;
  }

  static _listTools(mcpAggregator, res) {
    try {
      res.json({ tools: mcpAggregator.getAllTools() });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async _callTool(mcpAggregator, req, res) {
    const { name, arguments: args } = req.body || {};
    if (!name) {
      res.status(400).json({ error: 'Tool name is required' });
      return;
    }
    try {
      res.json(await mcpAggregator.handleToolCall(name, args || {}));
    } catch (error) {
      const status = error.message.includes('disabled') ? 503 : 400;
      res.status(status).json({ content: McpResult.error(error.message).content });
    }
  }
}

module.exports = McpProxyRoutes;
