const express = require('express');
const http = require('http');
const path = require('path');
const SharingListener = require('../host/SharingListener');
const SharingRouter = require('../host/routes/SharingRouter');
const OriginPolicy = require('../OriginPolicy');
const ShareRouter = require('./ShareRouter');
const WebMountRegistry = require('./WebMountRegistry');

class WebAppServer extends SharingListener {
  static BODY_LIMIT = '50mb';
  static NO_INDEX = 'noindex, nofollow, noarchive, nosnippet';
  static SHELL_FILE = 'index.html';
  static MODAL_FILE = 'luma-modal.js';

  static defaultAssetDirs() {
    const coreDir = path.join(__dirname, '..', '..');
    const modulesDir = path.join(coreDir, '..', 'node_modules');
    return {
      publicDir: path.join(__dirname, 'public'),
      llmUiDir: path.join(coreDir, 'llm-server', 'ui'),
      shellUiDir: path.join(coreDir, 'shell', 'ui'),
      monacoDir: path.join(modulesDir, 'monaco-editor', 'min', 'vs'),
      chartDir: path.join(modulesDir, 'chart.js', 'dist'),
    };
  }

  static normalizePrefix(prefix) {
    return WebMountRegistry.normalizePrefix(prefix);
  }

  constructor({ hostService, assetDirs = {} } = {}) {
    super();
    if (!hostService) throw new Error('WebAppServer requires a hostService');
    this._hostService = hostService;
    this._dirs = { ...WebAppServer.defaultAssetDirs(), ...assetDirs };
    this._mounts = new WebMountRegistry();
    this._hooksRouter = null;
  }

  setHooksRouter(router) {
    this._hooksRouter = router || null;
  }

  registerMount(prefix, handlers) {
    return this._mounts.register(prefix, handlers);
  }

  buildApp() {
    const app = express();
    app.disable('x-powered-by');
    this._useBodyParsers(app);
    this._useNoIndexHeader(app);
    this._useOriginGate(app);
    this._useHostRoutes(app);
    app.use(this._mounts.createDispatcher());
    this._useDesktopUi(app);
    app.use(express.static(this._dirs.publicDir, { index: WebAppServer.SHELL_FILE }));
    this._useSpaFallback(app);
    return app;
  }

  _useBodyParsers(app) {
    const jsonParser = express.json({ limit: WebAppServer.BODY_LIMIT });
    const formParser = express.urlencoded({ extended: true });
    app.use((req, res, next) => (this._isHookRequest(req) ? next() : jsonParser(req, res, next)));
    app.use((req, res, next) => (this._isHookRequest(req) ? next() : formParser(req, res, next)));
  }

  _isHookRequest(req) {
    return !!this._hooksRouter && (req.path === '/hooks' || req.path.startsWith('/hooks/'));
  }

  _useNoIndexHeader(app) {
    app.use((req, res, next) => {
      res.setHeader('X-Robots-Tag', WebAppServer.NO_INDEX);
      next();
    });
  }

  _useOriginGate(app) {
    app.use((req, res, next) => {
      if (!this._originAllowed(req)) return res.status(403).send('Origin not allowed by sharing policy');
      next();
    });
  }

  _useHostRoutes(app) {
    app.use('/sharing', SharingRouter.create(this._hostService));
    app.use('/share', new ShareRouter(this._hostService, { publicDir: this._dirs.publicDir }).build());
    if (this._hooksRouter) app.use('/hooks', this._hooksRouter);
  }

  _useDesktopUi(app) {
    app.use('/llm-ui/lib/monaco', express.static(this._dirs.monacoDir));
    app.use('/llm-ui/lib/chart', express.static(this._dirs.chartDir));
    app.get(`/llm-ui/${WebAppServer.MODAL_FILE}`, (req, res) => res.sendFile(WebAppServer.MODAL_FILE, { root: this._dirs.shellUiDir }));
    app.use('/llm-ui', express.static(this._dirs.llmUiDir));
  }

  _useSpaFallback(app) {
    app.use((req, res, next) => {
      if (req.method !== 'GET') return next();
      if (req.path.startsWith('/sharing/') || req.path.startsWith('/share/')) return next();
      if (this._mounts.mountFor(req.path)) return next();
      res.sendFile(WebAppServer.SHELL_FILE, { root: this._dirs.publicDir });
    });
  }

  _createServer() {
    const server = http.createServer(this.buildApp());
    server.on('upgrade', (req, socket, head) => this._onUpgrade(req, socket, head));
    return server;
  }

  _onUpgrade(req, socket, head) {
    try {
      if (this._originAllowed(req) && this._mounts.dispatchUpgrade(req, socket, head)) return;
    } catch (err) {
      console.warn('[sharing] web upgrade handler failed:', err && err.message);
    }
    WebAppServer._destroy(socket);
  }

  _originAllowed(req) {
    return OriginPolicy.originAllowed(this._hostService.getBindMode(), req);
  }

  _logName() {
    return 'web app server';
  }

  _fallbackError(port) {
    return `Could not start web backend on port ${port}.`;
  }

  static _destroy(socket) {
    try {
      socket.destroy();
    } catch (_) {}
  }
}

module.exports = WebAppServer;
