const fs = require('fs');
const CoreRequire = require('../CoreRequire');
const TerminalAuth = require('./TerminalAuth');
const TerminalSession = require('./TerminalSession');
const GitLog = require('./GitLog');

const ContainerFs = CoreRequire.require('shell/ContainerFs');

class TerminalBridge {
  static MAX_FRAME_BYTES = 4 * 1024 * 1024;
  static UNAUTHORIZED = 'HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n';

  constructor({ getRouter, getAgentManager, getHandshake, getLlmServer, fsOps, WebSocketServer, runGit } = {}) {
    this._deps = {
      getRouter, getAgentManager, getLlmServer,
      fso: fsOps || ContainerFs.routed(fs),
      runGit: runGit || GitLog.run,
    };
    this._getHandshake = getHandshake;
    const Server = WebSocketServer || TerminalBridge._wsServerClass();
    this._wss = Server ? new Server({ noServer: true, maxPayload: TerminalBridge.MAX_FRAME_BYTES }) : null;
    this._sessions = new Set();
  }

  get available() {
    return !!this._wss;
  }

  stats() {
    return { sessions: this._sessions.size };
  }

  handleUpgrade(req, socket, head) {
    if (!this._wss) return TerminalBridge._destroy(socket);
    const auth = TerminalAuth.authorize(req, this._getHandshake && this._getHandshake());
    if (!auth.ok) return TerminalBridge._refuse(socket);
    return this._wss.handleUpgrade(req, socket, head, (ws) => this._attach(ws));
  }

  _attach(ws) {
    const session = new TerminalSession(ws, this._deps);
    this._sessions.add(session);
    ws.on('close', () => {
      this._sessions.delete(session);
      session.dispose();
    });
  }

  static _wsServerClass() {
    try { return require('ws').WebSocketServer || null; } catch (_) { return null; }
  }

  static _refuse(socket) {
    try { socket.write(TerminalBridge.UNAUTHORIZED); } catch (_) {}
    TerminalBridge._destroy(socket);
  }

  static _destroy(socket) {
    try { socket.destroy(); } catch (_) {}
  }
}

module.exports = TerminalBridge;
