const http = require('http');
const express = require('express');
const httpProxy = require('http-proxy');

class AuthProxy {
  static HOST = '127.0.0.1';

  constructor({ apiSecurity } = {}) {
    this.apiSecurity = apiSecurity || null;
    this.server = null;
    this.proxy = null;
    this.publicPort = null;
    this.privatePort = null;
  }

  async start({ publicPort, privatePort }) {
    this._assertCanStart(publicPort, privatePort);
    this.publicPort = publicPort;
    this.privatePort = privatePort;
    this.proxy = this._createProxy(privatePort);
    this.server = http.createServer(this._createApp());
    await this._listen(publicPort);
  }

  async stop() {
    if (!this.server) return;
    const server = this.server;
    this.server = null;
    await new Promise((resolve) => server.close(() => resolve()));
    this._closeProxy();
    this.publicPort = null;
    this.privatePort = null;
  }

  isRunning() {
    return !!this.server;
  }

  _assertCanStart(publicPort, privatePort) {
    if (this.server) throw new Error('AuthProxy: already running');
    if (!publicPort || !privatePort) throw new Error('AuthProxy: publicPort and privatePort are required');
  }

  _createProxy(privatePort) {
    const proxy = httpProxy.createProxyServer({
      target: `http://${AuthProxy.HOST}:${privatePort}`,
      changeOrigin: false,
      ws: false,
    });
    proxy.on('error', (err, req, res) => AuthProxy._replyBadGateway(res, err));
    return proxy;
  }

  _createApp() {
    const app = express();
    if (this.apiSecurity && typeof this.apiSecurity.middleware === 'function') {
      app.use(this.apiSecurity.middleware());
    }
    app.use((req, res) => this.proxy.web(req, res));
    return app;
  }

  _listen(publicPort) {
    return new Promise((resolve, reject) => {
      const onError = (err) => {
        this.server = null;
        this._closeProxy();
        this.publicPort = null;
        this.privatePort = null;
        reject(err);
      };
      this.server.once('error', onError);
      this.server.listen(publicPort, AuthProxy.HOST, () => {
        this.server.removeListener('error', onError);
        resolve();
      });
    });
  }

  _closeProxy() {
    if (!this.proxy) return;
    try {
      this.proxy.close();
    } catch (_) {}
    this.proxy = null;
  }

  static _replyBadGateway(res, err) {
    if (!res || res.headersSent) return;
    try {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `image-server proxy: ${err.message}` }));
    } catch (_) {}
  }
}

module.exports = AuthProxy;
