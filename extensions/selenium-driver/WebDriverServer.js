const express = require('express');
const WebDriverError = require('./WebDriverError');
const WebDriverSessionRegistry = require('./WebDriverSessionRegistry');
const WebDriverRouteTable = require('./WebDriverRouteTable');
const WebDriverCommandTable = require('./WebDriverCommandTable');
const ExposedServerKeyGuard = require('../../core/shared/net/ExposedServerKeyGuard');

class WebDriverServer {
  static BODY_LIMIT = '32mb';

  static DEFAULT_HOST = '127.0.0.1';

  constructor(options) {
    this.browser = options.browser;
    this.apiSecurity = options.apiSecurity || null;
    this.fallback = options.fallback || null;
    this.fallbackDefaults = options.fallbackDefaults || {};
    this.prefix = (options.prefix || '').replace(/\/$/, '');
    this.registry = new WebDriverSessionRegistry();
    this.host = WebDriverServer.DEFAULT_HOST;
    this.httpServer = null;
    this.app = this._buildApp();
  }

  start(port, host = WebDriverServer.DEFAULT_HOST) {
    const refused = ExposedServerKeyGuard.startRefusal(host, this.apiSecurity);
    if (refused) return Promise.reject(new Error(refused));
    this.host = host;
    return new Promise((resolve, reject) => {
      const fail = (err) => {
        this.httpServer = null;
        reject(err);
      };
      try {
        this.httpServer = this.app.listen(port, host, (err) => (err ? fail(err) : this._onListening(host, resolve)));
        this.httpServer.on('error', fail);
      } catch (err) {
        fail(err);
      }
    });
  }

  async stop() {
    if (!this.httpServer) return;
    await new Promise((resolve) => this.httpServer.close(() => resolve()));
    this.httpServer = null;
    for (const session of this.registry.all()) this.registry.delete(session.id);
  }

  isRunning() { return !!this.httpServer; }

  port() {
    const addr = this.httpServer ? this.httpServer.address() : null;
    return addr ? addr.port : null;
  }

  activeSessions() {
    return this.registry.all().map((s) => ({ id: s.id, tabId: s.tabId, createdAt: s.createdAt }));
  }

  _onListening(host, resolve) {
    console.log(`selenium-driver: WebDriver server listening on http://${host}:${this.port()}${this.prefix}`);
    resolve(this.port());
  }

  _buildApp() {
    const app = express();
    app.disable('x-powered-by');
    app.use((req, res, next) => this._guard(req, res, next));
    app.use(express.json({ limit: WebDriverServer.BODY_LIMIT }));
    const commands = WebDriverCommandTable.build(this._commandContext());
    for (const [method, path, name, opts] of WebDriverRouteTable.ROUTES) {
      app[method.toLowerCase()](this.prefix + path, (req, res) => this._handle(commands.get(name), opts || {}, req, res));
    }
    app.use((req, res) => WebDriverServer._sendError(res, WebDriverError.unknownCommand(`${req.method} ${req.path}`)));
    return app;
  }

  _guard(req, res, next) {
    const refused = ExposedServerKeyGuard.refusal(req, this.host, this.apiSecurity);
    if (!refused) return next();
    WebDriverServer._setHeaders(res);
    return res.status(refused.status).json({ value: { error: 'unknown error', message: refused.reason, stacktrace: '' } });
  }

  _commandContext() {
    return { browser: this.browser, fallback: this.fallback, fallbackDefaults: this.fallbackDefaults, registry: this.registry };
  }

  async _handle(command, opts, req, res) {
    WebDriverServer._setHeaders(res);
    try {
      const session = this._sessionFor(req, opts);
      const value = await command(session, WebDriverRouteTable.remapParams(req.params || {}), req);
      res.status(200).json({ value: value === undefined ? null : value });
    } catch (err) {
      WebDriverServer._sendError(res, err);
    }
  }

  _sessionFor(req, opts) {
    const id = req.params && req.params.sessionId;
    if (!id) {
      if (opts.requiresSession) throw WebDriverError.invalidSessionId('session id required');
      return null;
    }
    const session = this.registry.get(id);
    if (!session) throw WebDriverError.invalidSessionId(`Unknown session: ${id}`);
    return session;
  }

  static _setHeaders(res) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
  }

  static _sendError(res, err) {
    const { status, body } = WebDriverError.serialize(err);
    res.status(status).json(body);
  }
}

module.exports = WebDriverServer;
