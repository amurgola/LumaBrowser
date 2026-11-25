const AppModules = require('../AppModules');
const DeviceViewer = require('./DeviceViewer');

class ViewerSocket {
  static MAX_MESSAGE_BYTES = 64 * 1024;

  constructor({ tokens, sessions, settings, WebSocketServer = ViewerSocket._loadWebSocketServer() }) {
    this._tokens = tokens;
    this._sessions = sessions;
    this._settings = settings;
    this._server = WebSocketServer ? new WebSocketServer({ noServer: true, maxPayload: ViewerSocket.MAX_MESSAGE_BYTES }) : null;
  }

  static _loadWebSocketServer() {
    try { return AppModules.load('ws').WebSocketServer; } catch (_) { return null; }
  }

  handleUpgrade(request, socket, head) {
    const deviceName = this._admitted(request);
    if (!deviceName) { socket.destroy(); return; }
    this._server.handleUpgrade(request, socket, head, (webSocket) => { this._serve(webSocket, deviceName); });
  }

  _admitted(request) {
    if (!this._server) return null;
    let url;
    try { url = new URL(String(request.url || ''), 'http://localhost'); } catch (_) { return null; }
    const origin = request.headers.origin;
    if (origin && ViewerSocket._hostOf(origin) !== request.headers.host) return null;
    return this._tokens.redeem(url.searchParams.get('token'));
  }

  static _hostOf(origin) {
    try { return new URL(origin).host; } catch (_) { return ''; }
  }

  async _serve(webSocket, deviceName) {
    ViewerSocket._say(webSocket, { type: 'status', state: 'starting' });
    try {
      const session = await this._sessions.open(deviceName);
      new DeviceViewer({ socket: webSocket, session, settings: this._settings }).attach();
    } catch (error) {
      ViewerSocket._say(webSocket, { type: 'status', state: 'failed', message: error.message });
      webSocket.close();
    }
  }

  static _say(webSocket, message) {
    try { webSocket.send(JSON.stringify(message)); } catch (_) {}
  }
}

module.exports = ViewerSocket;
