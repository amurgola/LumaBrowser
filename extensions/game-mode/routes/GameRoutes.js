const path = require('path');
const express = require('express');
const PhaserDist = require('../flatten/PhaserDist');
const RoomRelay = require('../rooms/RoomRelay');
const RoomInvite = require('../rooms/RoomInvite');
const AiRoutes = require('./AiRoutes');
const GameLookup = require('./GameLookup');
const GamePublisher = require('./GamePublisher');
const GameZipExporter = require('./GameZipExporter');
const PlayRequest = require('./PlayRequest');

class GameRoutes {
  static create(context) {
    return new GameRoutes(context)._build();
  }

  constructor(context) {
    this._context = context;
    this._api = context.extensionApi;
    this._rooms = new RoomRelay();
    this._publisher = new GamePublisher();
  }

  _build() {
    this._publishGateway();
    const router = express.Router();
    router.get(/^\/play\//, (req, res) => this._play(req, res));
    AiRoutes.mount(router, this._context, this._api);
    router.post('/open-tab/:convId', (req, res) => this._openTab(req, res));
    router.get('/export/:convId', (req, res) => this._export(req, res));
    router.post('/publish/:convId', (req, res) => this._publish(req, res));
    router.post('/room/:convId', (req, res) => this._room(req, res));
    return router;
  }

  _publishGateway() {
    const gateway = this._context.gateway;
    if (this._api.gatewayInfo && gateway && gateway.baseUrl) this._api.gatewayInfo.baseUrl = gateway.baseUrl;
    if (gateway && typeof gateway.registerUpgrade === 'function' && this._rooms.available) {
      gateway.registerUpgrade('/ws', (req, socket, head) => this._rooms.handleUpgrade(req, socket, head));
    }
  }

  _play(req, res) {
    const target = PlayRequest.resolve(this._api, req.path);
    if (target.status) return res.status(target.status).end();
    res.set('Cache-Control', 'no-store');
    return res.sendFile(path.relative(target.root, target.file), {
      root: target.root, etag: false, lastModified: false, cacheControl: false,
    }, (err) => { if (err && !res.headersSent) res.status(err.status || 404).end(); });
  }

  async _openTab(req, res) {
    const game = GameLookup.find(this._api, req.params.convId);
    if (!game) return res.status(404).json({ success: false, error: 'unknown game' });
    const browser = this._context.browser;
    if (!browser || typeof browser.createTab !== 'function') return res.status(503).json({ success: false, error: 'browser service unavailable' });
    const url = `${req.protocol}://${req.get('host')}/api/ext/game-mode/play/${game.convId}/index.html`;
    try {
      await browser.createTab(url, { activate: true, title: 'Game' });
      return res.json({ success: true, url });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  _export(req, res) {
    const game = GameLookup.find(this._api, req.params.convId, 'index.html');
    if (!game) return res.status(404).json({ success: false, error: 'unknown game' });
    const phaserPath = PhaserDist.path();
    if (!phaserPath) return res.status(500).json({ success: false, error: 'phaser dist not found' });
    res.set('Content-Type', 'application/zip');
    res.set('Content-Disposition', `attachment; filename="${GameZipExporter.fileName(game.root)}"`);
    return GameZipExporter.stream({
      root: game.root,
      phaserPath,
      output: res,
      onError: () => { if (!res.headersSent) res.status(500).end(); else res.end(); },
    });
  }

  _publish(req, res) {
    const game = GameLookup.find(this._api, req.params.convId, 'index.html');
    if (!game) return res.status(404).json({ success: false, error: 'unknown game' });
    const r = this._publisher.publish(game.root, req.params.convId);
    return res.status(r.status).json(r.body);
  }

  _room(req, res) {
    let room;
    try { room = this._api.sanitizeConvId(req.params.convId); } catch (_) { return res.status(404).json({ success: false, error: 'unknown game' }); }
    if (!this._rooms.available) return res.status(503).json({ success: false, error: 'ws unavailable in this install' });
    const token = this._rooms.issueToken(room);
    const invite = RoomInvite.build({ room, token, host: req.get('host') });
    return res.json({ success: true, room, token, ...invite, ...this._rooms.stats(room) });
  }
}

module.exports = GameRoutes;
