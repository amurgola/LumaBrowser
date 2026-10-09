const SharedArtifacts = require('../SharedArtifacts');
const RouteReply = require('./RouteReply');

class ArtifactRoutes {
  constructor(service, auth) {
    this._artifacts = new SharedArtifacts(service);
    this._auth = auth;
  }

  mount(router) {
    const browserJson = this._auth.requireBrowserCredential();
    router.get('/artifacts/:id', this._auth.requireToken, (req, res) => RouteReply.send(res, this._artifacts.describe(req.params.id)));
    router.get('/artifacts/:id/view', this._auth.requireBrowserCredential({ as: 'text' }), (req, res) => this._view(req, res));
    router.get('/artifact-data/:rootId', browserJson, (req, res) => RouteReply.send(res, this._artifacts.data(req.params.rootId, req.query.since)));
    router.post('/artifact-data/:rootId', browserJson, (req, res) => RouteReply.send(res, this._artifacts.mutate(req.params.rootId, req.body || {})));
  }

  _view(req, res) {
    const html = this._artifacts.html(req.params.id);
    if (html == null) return res.status(404).send('Artifact not found');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  }
}

module.exports = ArtifactRoutes;
