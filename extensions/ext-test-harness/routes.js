const express = require('express');

module.exports = function createRoutes(context) {
  const router = express.Router();
  const api = context.extensionApi;

  router.get('/tests', (req, res) => {
    try {
      const tests = api.discoverTests();
      res.json({ success: true, tests, count: tests.length });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to discover tests', message: error.message });
    }
  });

  router.post('/tests/:testId/run', async (req, res) => {
    try {
      const { testId } = req.params;
      const { variantId } = req.body || {};

      const log = await api.runTest(testId, variantId);
      res.json({
        success: true,
        runId: log.runId,
        status: log.status,
        summary: log.toSummary().summary,
        assertions: log.assertions,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Test execution failed', message: error.message });
    }
  });

  router.get('/runs', (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const runs = api.getTestRuns(limit, offset);
      res.json({ success: true, runs, count: runs.length });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to retrieve runs', message: error.message });
    }
  });

  router.get('/runs/:runId', (req, res) => {
    try {
      const detail = api.getTestRunDetail(req.params.runId);
      if (!detail) return res.status(404).json({ success: false, error: 'Run not found' });
      res.json({ success: true, run: detail });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to retrieve run', message: error.message });
    }
  });

  router.delete('/runs/:runId', (req, res) => {
    try {
      if (!api.deleteTestRun(req.params.runId)) {
        return res.status(404).json({ success: false, error: 'Run not found' });
      }
      res.json({ success: true, message: 'Run deleted' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to delete run', message: error.message });
    }
  });

  return router;
};
