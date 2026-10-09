const express = require('express');

module.exports = function createRoutes(context) {
  const router = express.Router();
  const api = context.extensionApi;

  if (!api) {
    router.use((_req, res) => res.status(503).json({ success: false, error: 'selenium-driver not activated' }));
    return router;
  }

  router.get('/status', async (_req, res) => res.json({ success: true, ...api.status() }));

  router.post('/start', async (_req, res) => {
    const result = await api.start();
    res.status(result.success ? 200 : 500).json(result);
  });

  router.post('/stop', async (_req, res) => {
    const result = await api.stop();
    res.status(result.success ? 200 : 500).json(result);
  });

  router.get('/settings', async (_req, res) => res.json({ success: true, settings: api.getSettings() }));

  router.post('/settings', async (req, res) => res.json({ success: true, settings: api.setSettings(req.body || {}) }));

  return router;
};
