const express = require('express');

module.exports = function createRoutes(context) {
  const router = express.Router();
  const service = () => context.extensionApi.getService();

  router.get('/servers', (req, res) => {
    try { res.json({ success: true, servers: context.extensionApi.status() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
  });

  router.post('/servers', async (req, res) => {
    try { res.status(201).json({ success: true, server: await service().create(req.body) }); }
    catch (e) { res.status(400).json({ success: false, error: e.message }); }
  });

  router.put('/servers/:id', async (req, res) => {
    try { res.json({ success: true, server: await service().update(req.params.id, req.body) }); }
    catch (e) { res.status(400).json({ success: false, error: e.message }); }
  });

  router.post('/servers/:id/reconnect', async (req, res) => {
    try {
      const result = await service().reconnect(req.params.id);
      if (result === null) return res.status(404).json({ success: false, error: 'Server not found' });
      res.json({ success: true, result });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
  });

  router.delete('/servers/:id', async (req, res) => {
    try { res.json({ success: true, removed: await service().remove(req.params.id) }); }
    catch (e) { res.status(400).json({ success: false, error: e.message }); }
  });

  return router;
};
