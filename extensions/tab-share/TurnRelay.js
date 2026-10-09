const crypto = require('crypto');
const AppDependencyLoader = require('./AppDependencyLoader');
const UdpPortProbe = require('./UdpPortProbe');

class TurnRelay {
  static DEFAULT_PORT = 3478;
  static REALM = 'lumabrowser';
  static NOISE_RE = /ENETUNREACH|EHOSTUNREACH/;

  constructor({ Turn, log, probe } = {}) {
    this._Turn = Turn || null;
    this._log = log || (() => {});
    this._probe = probe || UdpPortProbe.check;
    this._server = null;
    this._port = null;
    this._lastError = null;
    this._users = new Map();
  }

  isSupported() {
    if (this._Turn) return true;
    try { this._Turn = AppDependencyLoader.load('node-turn'); return true; } catch (_) { return false; }
  }

  isRunning() {
    return !!this._server;
  }

  getPort() {
    return this._port;
  }

  async start({ port = TurnRelay.DEFAULT_PORT } = {}) {
    await this.stop();
    if (!this.isSupported()) return this._fail('The relay server package is not installed in this build.');
    const p = Number(port);
    if (!Number.isInteger(p) || p < 1 || p > 65535) return this._fail('Relay port must be between 1 and 65535.');
    const busy = await this._probe(p);
    if (busy) return this._fail(busy);
    return this._launch(p);
  }

  async stop() {
    const server = this._server;
    this._server = null;
    this._port = null;
    if (!server) return;
    try { server.stop(); } catch (_) {}
  }

  issueCredentials(id, { host, port } = {}) {
    const username = `ts-${crypto.randomBytes(4).toString('hex')}`;
    const credential = crypto.randomBytes(12).toString('base64url');
    this._users.set(id, { username, credential });
    if (this._server) this._server.addUser(username, credential);
    const p = port || this._port || TurnRelay.DEFAULT_PORT;
    return { urls: [`turn:${host}:${p}?transport=udp`], username, credential };
  }

  revoke(id) {
    const user = this._users.get(id);
    if (!user) return;
    this._users.delete(id);
    if (this._server) { try { this._server.removeUser(user.username); } catch (_) {} }
  }

  getStatus() {
    return { running: this.isRunning(), port: this._port, error: this._lastError, supported: this.isSupported() };
  }

  _launch(port) {
    try {
      this._server = new this._Turn(this._serverConfig(port));
      this._server.start();
      this._port = port;
      this._lastError = null;
      for (const user of this._users.values()) this._server.addUser(user.username, user.credential);
      this._log(`relay listening on udp/${port}`);
      return { success: true, port };
    } catch (err) {
      this._server = null;
      return this._fail(err && err.message ? err.message : 'Could not start the relay server.');
    }
  }

  _serverConfig(port) {
    return {
      listeningPort: port,
      authMech: 'long-term',
      realm: TurnRelay.REALM,
      credentials: {},
      debugLevel: 'ERROR',
      log: (msg) => this._onServerLog(msg),
    };
  }

  _onServerLog(msg) {
    const text = String(msg && msg.message ? msg.message : msg);
    if (!TurnRelay.NOISE_RE.test(text)) this._log(`turn: ${text}`);
  }

  _fail(error) {
    this._lastError = error;
    this._log(`relay not started: ${error}`);
    return { success: false, error };
  }
}

module.exports = TurnRelay;
