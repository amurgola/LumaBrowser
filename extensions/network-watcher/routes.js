const express = require('express');
const WatcherTestRun = require('./WatcherTestRun');
const WatcherInput = require('./WatcherInput');

module.exports = function createRoutes(context) {
  const router = express.Router();
  const watcherService = context.extensionApi.getWatcherService();
  const testRun = new WatcherTestRun(watcherService);

  router.get('/', (req, res) => {
    try {
      const watchers = watcherService.getAllWatchers().map((w) => w.toJSON());
      res.json({ success: true, watchers, count: watchers.length });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to retrieve watchers', message: error.message });
    }
  });

  router.post('/', (req, res) => {
    try {
      const missing = WatcherInput.missingField(req.body, 'urlPattern');
      if (missing) return res.status(400).json({ success: false, error: missing });
      const watcher = watcherService.addWatcher(req.body);
      res.status(201).json({ success: true, watcher: watcher.toJSON(), message: 'Network watcher created successfully' });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Failed to create watcher', message: error.message });
    }
  });

  router.get('/stats', (req, res) => {
    try {
      res.json({ success: true, stats: watcherService.getStats() });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to retrieve statistics', message: error.message });
    }
  });

  router.post('/test', async (req, res) => {
    try {
      const { urlPattern, sendTo, note, method, captureHeaders, captureBody } = req.body;
      const missing = WatcherInput.missingField(req.body, 'urlPattern');
      if (missing) return res.status(400).json({ success: false, error: missing });
      const result = await testRun.execute({ urlPattern, sendTo, note, method, captureHeaders, captureBody }, 'api');
      if (result.success) {
        res.json({ success: true, message: 'Test successful! Check your webhook endpoint.', result });
      } else {
        res.status(500).json({ success: false, error: 'Test failed', message: result.error });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to test watcher', message: error.message });
    }
  });

  router.get('/:id', (req, res) => {
    try {
      const watcher = watcherService.getWatcher(req.params.id);
      if (!watcher) return res.status(404).json({ success: false, error: 'Watcher not found' });
      res.json({ success: true, watcher: watcher.toJSON() });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to retrieve watcher', message: error.message });
    }
  });

  router.patch('/:id', (req, res) => {
    try {
      const watcher = watcherService.updateWatcher(req.params.id, req.body);
      if (!watcher) return res.status(404).json({ success: false, error: 'Watcher not found' });
      res.json({ success: true, watcher: watcher.toJSON(), message: 'Watcher updated successfully' });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Failed to update watcher', message: error.message });
    }
  });

  router.delete('/:id', (req, res) => {
    try {
      const deleted = watcherService.removeWatcher(req.params.id);
      if (!deleted) return res.status(404).json({ success: false, error: 'Watcher not found' });
      res.json({ success: true, message: 'Watcher deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to delete watcher', message: error.message });
    }
  });

  router.post('/:id/toggle', (req, res) => {
    try {
      const { enabled } = req.body;
      const invalid = WatcherInput.enabledError(enabled);
      if (invalid) return res.status(400).json({ success: false, error: invalid });
      const watcher = watcherService.setWatcherEnabled(req.params.id, enabled);
      if (!watcher) return res.status(404).json({ success: false, error: 'Watcher not found' });
      res.json({ success: true, watcher: watcher.toJSON(), message: `Watcher ${enabled ? 'enabled' : 'disabled'} successfully` });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to toggle watcher', message: error.message });
    }
  });

  router.get('/:id/last-response', (req, res) => {
    try {
      const watcher = watcherService.getWatcher(req.params.id);
      if (!watcher) return res.status(404).json({ success: false, error: 'Watcher not found' });
      if (!watcher.lastCapturedResponse) {
        return res.status(404).json({ success: false, error: 'No captured responses yet for this watcher' });
      }
      res.json({ success: true, watcherId: watcher.id, lastCapturedResponse: watcher.lastCapturedResponse });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to retrieve last response', message: error.message });
    }
  });

  return router;
};
