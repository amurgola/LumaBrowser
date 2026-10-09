class SharingListener {
  static BIND_HOST = '0.0.0.0';

  constructor() {
    this._server = null;
    this._port = null;
  }

  isRunning() {
    return !!this._server;
  }

  getPort() {
    return this._port;
  }

  async start(port) {
    if (this._server) await this.stop();
    return new Promise((resolve) => this._listen(port, SharingListener._once(resolve)));
  }

  stop() {
    return new Promise((resolve) => {
      const server = this._server;
      this._clearState();
      if (!server) return resolve({ success: true });
      SharingListener._close(server, () => resolve({ success: true }));
    });
  }


  _createServer() {
    throw new Error(`${this.constructor.name} must implement _createServer()`);
  }

  _logName() {
    throw new Error(`${this.constructor.name} must implement _logName()`);
  }

  _fallbackError(port) {
    throw new Error(`${this.constructor.name} must implement _fallbackError(port)`);
  }

  _onListening() {
    return {};
  }

  _onCleared() {}

  _listen(port, done) {
    let server;
    try {
      server = this._createServer();
    } catch (err) {
      return done({ success: false, error: (err && err.message) || String(err) });
    }
    server.on('error', (err) => this._onServerError(server, err, port, done));
    server.listen(port, SharingListener.BIND_HOST, () => done(this._onBound(server, port)));
  }

  _onServerError(server, err, port, done) {
    if (this._server === server) this._clearState();
    console.warn(`[sharing] ${this._logName()} error:`, err && err.message);
    done({ success: false, error: this._errorMessage(err, port) });
  }

  _onBound(server, port) {
    this._server = server;
    const address = server.address();
    this._port = (address && address.port) || port;
    const extra = this._onListening();
    console.log(`[sharing] ${this._logName()} listening on ${SharingListener.BIND_HOST}:${this._port}`);
    return { success: true, port: this._port, ...extra };
  }

  _clearState() {
    this._server = null;
    this._port = null;
    this._onCleared();
  }

  _errorMessage(err, port) {
    const code = err && err.code;
    if (code === 'EADDRINUSE') return `Port ${port} is already in use by another program.`;
    if (code === 'EACCES') return `Permission denied for port ${port}. Try a port above 1024.`;
    return (err && err.message) || this._fallbackError(port);
  }

  static _close(server, onClosed) {
    try {
      server.close(onClosed);
      if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
    } catch (_) {
      onClosed();
    }
  }

  static _once(resolve) {
    let settled = false;
    return (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
  }
}

module.exports = SharingListener;
