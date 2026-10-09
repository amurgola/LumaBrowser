const crypto = require('crypto');

class WsHandshake {
  static GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

  static newKey() {
    return crypto.randomBytes(16).toString('base64');
  }

  static acceptFor(key) {
    return crypto.createHash('sha1').update(key + WsHandshake.GUID).digest('base64');
  }

  static requestHeaders(key, extra = {}) {
    return {
      Connection: 'Upgrade',
      Upgrade: 'websocket',
      'Sec-WebSocket-Version': '13',
      'Sec-WebSocket-Key': key,
      ...extra,
    };
  }

  static refusal(statusCode) {
    return new Error(statusCode === 401
      ? 'LumaBrowser refused the connection (bad or stale CLI token). Restart the app and try again.'
      : `unexpected HTTP ${statusCode} during WebSocket handshake`);
  }
}

module.exports = WsHandshake;
