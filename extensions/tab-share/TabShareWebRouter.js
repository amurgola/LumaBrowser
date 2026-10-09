const path = require('path');
const AppDependencyLoader = require('./AppDependencyLoader');
const TabShareList = require('./TabShareList');

class TabShareWebRouter {
  static WEB_DIR = path.join(__dirname, 'web');
  static WS_PATH_RE = /^\/tab\/([a-f0-9]{32})\/ws\/?$/;
  static MAX_WS_PAYLOAD = 64 * 1024;

  constructor(service, { webDir = TabShareWebRouter.WEB_DIR, WebSocketServer } = {}) {
    this._service = service;
    this._webDir = webDir;
    this._WebSocketServer = WebSocketServer === undefined ? TabShareWebRouter._loadWebSocketServer() : WebSocketServer;
  }

  buildRouter() {
    const express = AppDependencyLoader.load('express');
    const router = express.Router();
    router.use('/assets', express.static(this._webDir, { index: false, maxAge: 0 }));
    router.use('/:token', (req, res, next) => this._gateToken(req, res, next));
    router.get('/:token', (req, res) => this._viewerPage(res));
    router.get('/:token/info', (req, res) => this._info(req, res));
    router.use((req, res) => TabShareWebRouter._notFound(res));
    return router;
  }

  buildUpgrade() {
    const Server = this._WebSocketServer;
    const wss = Server ? new Server({ noServer: true, maxPayload: TabShareWebRouter.MAX_WS_PAYLOAD }) : null;
    return (req, socket, head) => this._upgrade(wss, req, socket, head);
  }

  _gateToken(req, res, next) {
    const token = String(req.params.token || '');
    if (!TabShareList.isToken(token)) return TabShareWebRouter._notFound(res);
    const share = this._service.resolve(token);
    if (!share) return TabShareWebRouter._notFound(res);
    req.tabShare = share;
    return next();
  }

  _viewerPage(res) {
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile('viewer.html', { root: this._webDir });
  }

  _info(req, res) {
    const s = req.tabShare;
    res.setHeader('Cache-Control', 'no-store');
    res.json({ title: s.title || '', pageUrl: s.url || '', mode: s.mode, live: s.tabId != null });
  }

  _upgrade(wss, req, socket, head) {
    const refuse = () => { try { socket.destroy(); } catch (_) {} };
    if (!wss) return refuse();
    const match = TabShareWebRouter.WS_PATH_RE.exec(String(req.url || '').split('?')[0]);
    if (!match) return refuse();
    const streamer = this._service.resolveStreamer(match[1]);
    if (!streamer) return refuse();
    return wss.handleUpgrade(req, socket, head, (ws) => { streamer.addClient(ws); });
  }

  static _notFound(res) {
    return res.status(404).send('Not found');
  }

  static _loadWebSocketServer() {
    try { return AppDependencyLoader.load('ws').WebSocketServer || null; } catch (_) { return null; }
  }
}

module.exports = TabShareWebRouter;
