const express = require('express');

module.exports = function createRoutes(context) {
  const router = express.Router();
  const api = context.extensionApi;

  router.get('/', (req, res) => {
    try {
      const monitors = api.getAllMonitors();
      res.json({ success: true, monitors, count: monitors.length });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.post('/', (req, res) => {
    try {
      const monitor = api.createMonitor(req.body);
      res.status(201).json({ success: true, monitor });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  router.get('/:id', (req, res) => {
    try {
      const monitor = api.getMonitor(req.params.id);
      if (!monitor) return res.status(404).json({ success: false, error: 'Monitor not found' });
      res.json({ success: true, monitor });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.patch('/:id', (req, res) => {
    try {
      const monitor = api.updateMonitor(req.params.id, req.body);
      if (!monitor) return res.status(404).json({ success: false, error: 'Monitor not found' });
      res.json({ success: true, monitor });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  router.delete('/:id', (req, res) => {
    try {
      const removed = api.deleteMonitor(req.params.id);
      res.json({ success: removed });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/:id/history', (req, res) => {
    try {
      if (req.query.page !== undefined || req.query.pageSize !== undefined || req.query.changedOnly !== undefined) {
        const result = api.getHistoryPaged(req.params.id, {
          page: parseInt(req.query.page, 10) || 0,
          pageSize: parseInt(req.query.pageSize, 10) || 25,
          changedOnly: req.query.changedOnly === '1' || req.query.changedOnly === 'true',
        });
        return res.json({ success: true, ...result });
      }
      const limit = parseInt(req.query.limit, 10) || 20;
      const history = api.getHistory(req.params.id, limit);
      res.json({ success: true, history });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.post('/:id/check', async (req, res) => {
    try {
      await api.checkMonitorNow(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.post('/:id/pick', async (req, res) => {
    try {
      const result = await api.pickElementsForMonitor(req.params.id);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
};
