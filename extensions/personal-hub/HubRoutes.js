const express = require('express');

class HubRoutes {
  static SIGNED_IN_HTML = '<!DOCTYPE html><html><body style="font-family:system-ui;padding:40px"><h2>Signed in</h2><p>The calendar is connected. You can close this tab.</p></body></html>';

  constructor({ api, inbound }) {
    this._api = api;
    this._inbound = inbound;
  }

  router() {
    const router = express.Router();
    router.get('/oauth/callback', (req, res) => this._oauthCallback(req, res));
    router.use(this._guard());
    this._mountQueue(router);
    this._mountBoard(router);
    this._mountRead(router);
    return router;
  }

  async _oauthCallback(req, res) {
    const { state, code, error } = req.query || {};
    const result = await this._api.completeOAuth(String(state || ''), code ? String(code) : null, error ? String(error) : null);
    if (!result || result.success === false) {
      return res.status(400).send(HubRoutes._failedHtml((result && result.error) || 'Sign-in failed'));
    }
    return res.status(200).send(HubRoutes.SIGNED_IN_HTML);
  }

  _guard() {
    return (req, res, next) => {
      if (this._inbound.matches(req.headers)) return next();
      return res.status(401).json({ success: false, error: 'Missing or invalid Hub token (Authorization: Bearer <token> or X-Hub-Token)' });
    };
  }

  _mountQueue(router) {
    router.post('/queue', (req, res) => HubRoutes._reply(res, () => ({ ...this._api.pushQueueItem(req.body || {}) })));
    router.post('/threads/enrich', (req, res) => HubRoutes._reply(res, () => {
      const body = req.body || {};
      const ref = body.id ? { id: body.id } : { app: body.app, threadKey: body.threadKey };
      if (!ref.id && !(ref.app && ref.threadKey)) throw new Error('Give id, or app and threadKey');
      const { id, app, threadKey, ...enrichment } = body;
      return { thread: this._api.enrichThread(ref, enrichment) };
    }));
    router.get('/threads', (req, res) => HubRoutes._reply(res, () => ({
      threads: this._api.listThreads({ state: req.query.state || 'open', app: req.query.app || null, limit: HubRoutes._int(req.query.limit, 100) }),
    })));
    router.get('/threads/:id', (req, res) => HubRoutes._reply(res, () => HubRoutes._found(this._api.getThread(req.params.id), 'Thread not found')));
    router.post('/threads/:id/state', (req, res) => HubRoutes._reply(res, () => ({
      thread: this._api.setThreadState(req.params.id, (req.body || {}).state, { snoozeUntil: (req.body || {}).snoozeUntil }),
    })));
  }

  _mountBoard(router) {
    router.get('/columns', (_req, res) => HubRoutes._reply(res, () => ({ columns: this._api.listColumns() })));
    router.get('/tasks', (req, res) => HubRoutes._reply(res, () => ({
      tasks: this._api.listTasks({ columnKey: req.query.columnKey || null, sourceId: req.query.sourceId || null, includeHidden: req.query.includeHidden === 'true' }),
    })));
    router.post('/tasks', (req, res) => HubRoutes._reply(res, async () => {
      const result = await this._api.createTask(req.body || {});
      return result && result.needsStatus ? { success: false, error: 'Pick a status for that column and send again with status.', ...result } : { task: result };
    }, 201));
    router.post('/tasks/hide', (req, res) => HubRoutes._reply(res, () => ({
      changed: this._api.setTasksHidden((req.body || {}).ids || [], (req.body || {}).hidden !== false),
    })));
    router.get('/tasks/:id', (req, res) => HubRoutes._reply(res, () => HubRoutes._found(this._api.getTask(req.params.id), 'Task not found')));
    router.patch('/tasks/:id', (req, res) => HubRoutes._reply(res, () => this._api.updateTask(req.params.id, req.body || {})));
    router.post('/tasks/:id/move', (req, res) => HubRoutes._reply(res, () => {
      const body = req.body || {};
      return this._api.moveTask(req.params.id, body.columnKey, body.status ? { status: body.status } : {});
    }));
    router.post('/statuses/link', (req, res) => HubRoutes._reply(res, () => {
      const body = req.body || {};
      return body.newColumn ? { column: this._api.addStatusColumn(body.status) } : this._api.linkStatus(body.status, body.columnKey);
    }));
    router.post('/tasks/:id/messages', (req, res) => HubRoutes._reply(res, () => this._api.addTaskMessage(req.params.id, (req.body || {}).body, { author: (req.body || {}).author || 'automation' }), 201));
  }

  _mountRead(router) {
    router.get('/events', (req, res) => HubRoutes._reply(res, () => ({
      events: this._api.listEvents(req.query.from ? { from: req.query.from, to: req.query.to || null } : { days: HubRoutes._int(req.query.days, 1) }),
    })));
    router.post('/sync', (req, res) => HubRoutes._reply(res, () => this._api.syncNow(req.body || {})));
    router.get('/status', (_req, res) => HubRoutes._reply(res, () => ({ status: this._api.syncStatus() })));
  }

  static async _reply(res, work, okStatus = 200) {
    try {
      const payload = await work();
      if (payload && payload.success === false) return res.status(400).json(payload);
      return res.status(okStatus).json({ success: true, ...payload });
    } catch (err) {
      return res.status(400).json({ success: false, error: (err && err.message) || String(err) });
    }
  }

  static _found(value, missing) {
    if (!value) throw new Error(missing);
    return value;
  }

  static _int(value, fallback) {
    const n = parseInt(value, 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  }

  static _failedHtml(message) {
    const safe = String(message).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    return `<!DOCTYPE html><html><body style="font-family:system-ui;padding:40px"><h2>Sign-in failed</h2><p>${safe}</p></body></html>`;
  }
}

module.exports = HubRoutes;
