const WsClient = require('./WsClient');

class BridgeConnector {
  static PATH = '/api/ext/code-mode/terminal';

  static url(port, token) {
    return `ws://127.0.0.1:${port}${BridgeConnector.PATH}?token=${encodeURIComponent(token)}`;
  }

  static async open({ port, token }) {
    const ws = new WsClient(BridgeConnector.url(port, token), { headers: { Authorization: `Bearer ${token}` } });
    await ws.connect();
    return ws;
  }
}

module.exports = BridgeConnector;
