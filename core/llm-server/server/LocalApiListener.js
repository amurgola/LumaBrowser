const http = require('http');

class LocalApiListener {
  static BIND_HOST = '127.0.0.1';

  constructor({ logTag = '[local-api]' } = {}) {
    this._server = null;
    this.port = null;
    this.lastError = null;
    this._logTag = logTag;
  }

  isRunning() {
    return !!this._server;
  }

  address() {
    return this._server ? this._server.address() : null;
  }

  async start(app, port) {
    if (this._server) await this.stop();
    return this._listen(app, port);
  }

  stop() {
    const server = this._server;
    this._server = null;
    this.port = null;
    if (!server) return Promise.resolve({ success: true });
    return new Promise((resolve) => {
      try {
        server.close(() => resolve({ success: true }));
        if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
      } catch (_) {
        resolve({ success: true });
      }
    });
  }

  static errorMessage(err, port) {
    const code = err && err.code;
    if (code === 'EADDRINUSE') return `Port ${port} is already in use by another program. Pick another port for the local API.`;
    if (code === 'EACCES') return `Permission denied for port ${port}. Try a port above 1024.`;
    return (err && err.message) || `Could not start the local API on port ${port}.`;
  }

  _listen(app, port) {
    return new Promise((resolve) => {
      let settled = false;
      const done = (result) => { if (!settled) { settled = true; resolve(result); } };
      const server = http.createServer(app);
      server.on('error', (err) => done(this._onError(server, err, port)));
      server.listen(port, LocalApiListener.BIND_HOST, () => done(this._onListening(server, port)));
    });
  }

  _onListening(server, port) {
    this._server = server;
    const addr = server.address();
    this.port = (addr && addr.port) || port;
    this.lastError = null;
    console.log(`${this._logTag} OpenAI-compatible endpoint at http://${LocalApiListener.BIND_HOST}:${this.port}/v1`);
    return { success: true, port: this.port };
  }

  _onError(server, err, port) {
    if (this._server === server) {
      this._server = null;
      this.port = null;
    }
    this.lastError = LocalApiListener.errorMessage(err, port);
    console.warn(`${this._logTag} listener error:`, err && err.message);
    return { success: false, error: this.lastError };
  }
}

module.exports = LocalApiListener;
