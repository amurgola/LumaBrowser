const http = require('http');
const { EventEmitter } = require('events');
const WsFrameCodec = require('./WsFrameCodec');
const WsHandshake = require('./WsHandshake');

class WsClient extends EventEmitter {
  static MAX_MESSAGE_BYTES = 16 * 1024 * 1024;
  static CLOSE_GRACE_MS = 200;

  constructor(url, opts = {}) {
    super();
    this.url = new URL(url);
    this.headers = opts.headers || {};
    this.timeoutMs = opts.timeoutMs || 10000;
    this.socket = null;
    this.buffer = Buffer.alloc(0);
    this.fragments = [];
    this.closed = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const key = WsHandshake.newKey();
      const req = this._upgradeRequest(key);
      req.on('upgrade', (res, socket, head) => this._onUpgrade({ key, res, socket, head, resolve, reject }));
      req.on('response', (res) => { res.resume(); reject(WsHandshake.refusal(res.statusCode)); });
      req.on('timeout', () => { req.destroy(new Error('WebSocket connect timed out')); });
      req.on('error', reject);
      req.end();
    });
  }

  send(text) {
    if (!this.socket || this.closed) return false;
    this.socket.write(WsFrameCodec.encode(WsFrameCodec.TEXT, Buffer.from(String(text), 'utf8')));
    return true;
  }

  sendJson(obj) {
    return this.send(JSON.stringify(obj));
  }

  close(code = 1000) {
    if (!this.socket || this.closed) return;
    const body = Buffer.alloc(2);
    body.writeUInt16BE(code, 0);
    try { this.socket.write(WsFrameCodec.encode(WsFrameCodec.CLOSE, body)); } catch (_) {}
    const socket = this.socket;
    setTimeout(() => { try { socket.destroy(); } catch (_) {} }, WsClient.CLOSE_GRACE_MS);
  }

  _upgradeRequest(key) {
    return http.request({
      host: this.url.hostname,
      port: Number(this.url.port) || 80,
      path: `${this.url.pathname}${this.url.search}`,
      method: 'GET',
      headers: WsHandshake.requestHeaders(key, this.headers),
      timeout: this.timeoutMs,
    });
  }

  _onUpgrade({ key, res, socket, head, resolve, reject }) {
    if (res.headers['sec-websocket-accept'] !== WsHandshake.acceptFor(key)) {
      socket.destroy();
      reject(new Error('WebSocket handshake failed'));
      return;
    }
    this._attach(socket, head);
    resolve();
  }

  _attach(socket, head) {
    this.socket = socket;
    socket.setNoDelay(true);
    if (head && head.length) this._onData(head);
    socket.on('data', (d) => this._onData(d));
    socket.on('close', () => { this.closed = true; this.emit('close'); });
    socket.on('error', (e) => this.emit('error', e));
  }

  _onData(chunk) {
    this.buffer = this.buffer.length ? Buffer.concat([this.buffer, chunk]) : chunk;
    for (;;) {
      const frame = WsFrameCodec.decode(this.buffer);
      if (!frame) return;
      this.buffer = this.buffer.subarray(frame.length);
      this._onFrame(frame);
    }
  }

  _onFrame(frame) {
    switch (frame.opcode) {
      case WsFrameCodec.CONTINUATION:
      case WsFrameCodec.TEXT: return this._onTextFragment(frame);
      case WsFrameCodec.CLOSE: return this._onPeerClose();
      case WsFrameCodec.PING: return this._pong(frame.payload);
      default: return undefined;
    }
  }

  _onTextFragment(frame) {
    this.fragments.push(frame.payload);
    if (!frame.fin) return;
    const message = Buffer.concat(this.fragments);
    this.fragments = [];
    if (message.length > WsClient.MAX_MESSAGE_BYTES) return;
    this.emit('message', message.toString('utf8'));
  }

  _onPeerClose() {
    this.closed = true;
    try { this.socket.end(); } catch (_) {}
    this.emit('close');
  }

  _pong(payload) {
    try { this.socket.write(WsFrameCodec.encode(WsFrameCodec.PONG, payload)); } catch (_) {}
  }
}

module.exports = WsClient;
