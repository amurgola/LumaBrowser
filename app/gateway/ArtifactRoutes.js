const ConfinedFile = require('./ConfinedFile');

class ArtifactRoutes {
  constructor({ app, guard, artifactsDir, artifactDataStore, liveApi }) {
    this._app = app;
    this._guard = guard;
    this._dir = artifactsDir;
    this._data = artifactDataStore;
    this._liveApi = liveApi;
  }

  mount() {
    this._mountData();
    this._mountLiveApi();
    this._app.get(/^\/artifacts\//, this._guard, ConfinedFile.handler(this._dir, /^\/artifacts\/?/));
  }

  _mountData() {
    this._app.get('/artifacts/data/:rootId', this._guard, (req, res) => ArtifactRoutes.readData(this._data, req, res));
    this._app.post('/artifacts/data/:rootId', this._guard, (req, res) => {
      const body = req.body || {};
      const result = this._data.mutate(req.params.rootId, { set: body.set, remove: body.remove });
      res.status(result.success ? 200 : 400).json(result);
    });
  }

  _mountLiveApi() {
    this._app.post('/artifacts/api/fetch', this._guard, async (req, res) => ArtifactRoutes.reply(res, await this._liveApi.fetchPage(req.body || {})));
    this._app.post('/artifacts/api/open-tab', this._guard, async (req, res) => ArtifactRoutes.reply(res, await this._liveApi.openTab(req.body || {})));
  }

  static readData(store, req, res) {
    const snap = store.all(req.params.rootId);
    if (!snap.success) return res.status(404).json(snap);
    const since = parseInt(req.query && req.query.since, 10);
    if (Number.isFinite(since) && snap.rev <= since) return res.status(204).end();
    return res.json(snap);
  }

  static reply(res, result) {
    return res.status(result.success ? 200 : 400).json(result);
  }
}

module.exports = ArtifactRoutes;
