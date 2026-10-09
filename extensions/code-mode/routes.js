const express = require('express');

module.exports = function createRoutes(context) {
  const router = express.Router();
  const bridge = context.extensionApi && context.extensionApi.terminalBridge;

  if (bridge && bridge.available && context.gateway && typeof context.gateway.registerUpgrade === 'function') {
    context.gateway.registerUpgrade('/terminal', (req, socket, head) => bridge.handleUpgrade(req, socket, head));
  }

  router.get('/terminal/info', (req, res) => {
    res.json({
      success: true,
      available: !!(bridge && bridge.available),
      sessions: bridge && bridge.stats ? bridge.stats().sessions : 0,
    });
  });

  return router;
};
