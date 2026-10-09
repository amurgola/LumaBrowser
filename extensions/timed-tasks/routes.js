const express = require('express');

module.exports = function createRoutes(context) {
  const router = express.Router();
  const api = context.extensionApi;

  router.get('/', (req, res) => {
    try {
      const tasks = api.getAllTasks();
      res.json({ success: true, tasks, count: tasks.length });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to retrieve tasks', message: error.message });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const { name, requestPrompt } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, error: 'Missing required field: name' });
      }
      if (!requestPrompt) {
        return res.status(400).json({ success: false, error: 'Missing required field: requestPrompt' });
      }
      const task = await api.createTask(req.body);
      res.status(201).json({ success: true, task, message: 'Task created successfully' });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Failed to create task', message: error.message });
    }
  });

  router.get('/:id', (req, res) => {
    try {
      const task = api.getTask(req.params.id);
      if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
      res.json({ success: true, task });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to retrieve task', message: error.message });
    }
  });

  router.patch('/:id', async (req, res) => {
    try {
      const task = api.getTask(req.params.id);
      if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
      const updated = api.updateTask(req.params.id, req.body || {});
      res.json({ success: true, task: updated, message: 'Task updated successfully' });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Failed to update task', message: error.message });
    }
  });

  router.delete('/:id', (req, res) => {
    try {
      const task = api.getTask(req.params.id);
      if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
      api.deleteTask(req.params.id);
      res.json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to delete task', message: error.message });
    }
  });

  router.post('/:id/enable', (req, res) => {
    try {
      const task = api.setEnabled(req.params.id, true);
      if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
      res.json({ success: true, task, message: 'Task resumed' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to enable task', message: error.message });
    }
  });

  router.post('/:id/disable', (req, res) => {
    try {
      const task = api.setEnabled(req.params.id, false);
      if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
      res.json({ success: true, task, message: 'Task paused' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to disable task', message: error.message });
    }
  });

  router.post('/:id/trigger', async (req, res) => {
    try {
      const task = api.getTask(req.params.id);
      if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
      const silent = req.body && req.body.silent !== undefined ? !!req.body.silent : false;
      const result = await api.triggerNow(req.params.id, { silent });
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to trigger task', message: error.message });
    }
  });

  router.get('/:id/runs', (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;
      const runs = api.getTaskRuns(req.params.id, limit, offset);
      res.json({ success: true, runs, count: runs.length });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to retrieve runs', message: error.message });
    }
  });

  router.get('/runs/:runId', (req, res) => {
    try {
      const run = api.getRun(req.params.runId);
      if (!run) return res.status(404).json({ success: false, error: 'Run not found' });
      res.json({ success: true, run });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to retrieve run', message: error.message });
    }
  });

  return router;
};
