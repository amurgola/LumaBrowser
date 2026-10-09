const GameLookup = require('./GameLookup');

class AiRoutes {
  static mount(router, context, api) {
    new AiRoutes(context, api)._mount(router);
  }

  constructor(context, api) {
    this._context = context;
    this._api = api;
    this._ai = api.ai || null;
  }

  _mount(router) {
    router.get('/ai/:convId/ping', (req, res) => this._withGame(req, res, (c) => res.json(this._ping(c.convId))));
    router.post('/ai/:convId/complete', (req, res) => this._withGame(req, res, (c) => this._complete(c, req, res)));
    router.post('/ai/:convId/stream', (req, res) => this._withGame(req, res, (c) => this._stream(c, req, res)));
    router.get('/ai/:convId/store', (req, res) => this._withGame(req, res, (c) => AiRoutes._noStore(res).json(this._ai.storeFor(c.convId).all())));
    router.get('/ai/:convId/store/:col', (req, res) => this._withGame(req, res, (c) => AiRoutes._noStore(res).json({
      collection: req.params.col, items: this._ai.storeFor(c.convId).list(req.params.col),
    })));
    router.put('/ai/:convId/store/:col/:key', (req, res) => this._withGame(req, res, (c) => this._setValue(c, req, res)));
    router.delete('/ai/:convId/store/:col/:key', (req, res) => this._withGame(req, res, (c) => AiRoutes._result(res, this._ai.storeFor(c.convId).remove(req.params.col, req.params.key))));
    router.delete('/ai/:convId/store/:col', (req, res) => this._withGame(req, res, (c) => AiRoutes._result(res, this._ai.storeFor(c.convId).clear(req.params.col))));
    router.delete('/ai/:convId/store', (req, res) => this._withGame(req, res, (c) => AiRoutes._result(res, this._ai.storeFor(c.convId).reset(), 500)));
    router.post('/ai/:convId/image', (req, res) => this._withGame(req, res, async (c) => AiRoutes._result(res, await this._ai.runtimeImage(c.convId, AiRoutes._body(req)))));
  }

  _withGame(req, res, handle) {
    if (!this._ai) return res.status(503).json({ success: false, error: 'AI runtime unavailable' });
    const game = GameLookup.find(this._api, req.params.convId);
    if (!game) return res.status(404).json({ success: false, error: 'unknown game' });
    if (this._ai.kindFor(game.convId) !== 'ai') return res.status(403).json({ success: false, error: 'not an AI game' });
    return handle(game);
  }

  _ping(convId) {
    let imageReady = false;
    try { imageReady = !!(this._context.chat && this._context.chat.isImageReady && this._context.chat.isImageReady()); } catch (_) {}
    return { ok: true, model: this._ai.bridge.resolveModelRef(convId) || null, imageReady, rev: this._ai.storeFor(convId).rev };
  }

  async _complete(c, req, res) {
    const r = await this._ai.bridge.complete(c.convId, AiRoutes._gameBody(req), { game: this._ai.framingFor(c.convId) });
    res.status(!r.success && r.busy ? 429 : 200).json(r);
  }

  _stream(c, req, res) {
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
    if (res.flushHeaders) res.flushHeaders();
    let ended = false;
    const send = (obj) => { try { res.write(`data: ${JSON.stringify(obj)}\n\n`); } catch (_) {} };
    const end = () => { if (ended) return; ended = true; try { res.end(); } catch (_) {} };
    const handle = this._ai.bridge.stream(c.convId, AiRoutes._gameBody(req), {
      onDelta: (t) => send({ delta: t }),
      onDone: (text) => { send({ done: true, text }); end(); },
      onError: (e) => { send({ error: (e && e.message) || 'stream failed' }); end(); },
    }, { game: this._ai.framingFor(c.convId) });
    res.on('close', () => { if (!ended) { try { handle.abort(); } catch (_) {} end(); } });
  }

  _setValue(c, req, res) {
    const body = AiRoutes._body(req);
    if (!Object.prototype.hasOwnProperty.call(body, 'value')) return res.status(400).json({ success: false, error: 'value is required' });
    return AiRoutes._result(res, this._ai.storeFor(c.convId).set(req.params.col, req.params.key, body.value));
  }

  static _body(req) {
    return req.body && typeof req.body === 'object' ? req.body : {};
  }

  static _gameBody(req) {
    const body = AiRoutes._body(req);
    delete body.modelRef;
    return body;
  }

  static _noStore(res) {
    res.set('Cache-Control', 'no-store');
    return res;
  }

  static _result(res, r, failStatus = 400) {
    return res.status(r.success ? 200 : failStatus).json(r);
  }
}

module.exports = AiRoutes;
