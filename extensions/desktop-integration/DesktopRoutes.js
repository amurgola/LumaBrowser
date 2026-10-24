const express = require('express');

class DesktopRoutes {
  constructor({ registry, token, clients, info }) {
    this._registry = registry;
    this._token = token;
    this._clients = clients;
    this._info = info;
  }

  router() {
    const router = express.Router();
    router.get('/hello', (_req, res) => {
      const { name, version, apiBase } = this._info();
      res.json({ success: true, name, apiBase, version });
    });
    router.use(this._guard());
    router.use('/:feature', (req, res, next) => this._dispatch(req, res, next));
    router.use((_req, res) => res.status(404).json({ success: false, error: 'Not found' }));
    return router;
  }

  _guard() {
    return (req, res, next) => {
      if (this._token.matches(req.headers)) return next();
      return res.status(401).json({ success: false, error: 'Missing or invalid desktop token (X-Luma-Desktop-Token: <token> or Authorization: Bearer <token>)' });
    };
  }

  _dispatch(req, res, next) {
    const id = req.params.feature;
    if (!this._registry.has(id)) return res.status(404).json({ success: false, error: 'Unknown feature', feature: id });
    const router = this._registry.routerFor(id);
    if (!router) return res.status(404).json({ success: false, error: 'Feature disabled', feature: id });
    this._clients.record(req.headers, id);
    return router(req, res, (err) => DesktopRoutes._fallthrough(err, req, res, next, id));
  }

  static _fallthrough(err, _req, res, _next, id) {
    if (res.headersSent) return undefined;
    if (err) return res.status(500).json({ success: false, error: (err && err.message) || String(err), feature: id });
    return res.status(404).json({ success: false, error: 'Not found', feature: id });
  }
}

module.exports = DesktopRoutes;
