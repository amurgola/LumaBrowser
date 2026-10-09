const crypto = require('crypto');

class RoomRelay {
  static MAX_MSG_BYTES = 64 * 1024;
  static OPEN = 1;

  constructor({ maxPerRoom = 8, WebSocketServer = RoomRelay._loadWebSocketServer() } = {}) {
    this._maxPerRoom = maxPerRoom;
    this._tokens = new Map();
    this._rooms = new Map();
    this._wss = WebSocketServer ? new WebSocketServer({ noServer: true }) : null;
    this._seq = 0;
  }

  static _loadWebSocketServer() {
    try { return require('ws').WebSocketServer; } catch (_) { return null; }
  }

  get available() {
    return !!this._wss;
  }

  issueToken(room) {
    for (const [token, entry] of this._tokens) if (entry.room === room) return token;
    const token = crypto.randomBytes(16).toString('hex');
    this._tokens.set(token, { room, created: Date.now() });
    return token;
  }

  validate(token, room) {
    const entry = this._tokens.get(String(token || ''));
    return !!entry && entry.room === String(room || '');
  }

  handleUpgrade(req, socket, head) {
    const room = this._admittedRoom(req);
    if (!room) return RoomRelay._destroy(socket);
    this._wss.handleUpgrade(req, socket, head, (ws) => this._join(room, ws));
  }

  stats(room) {
    const peers = this._rooms.get(String(room || ''));
    return { players: peers ? peers.size : 0 };
  }

  _admittedRoom(req) {
    if (!this._wss) return null;
    let url;
    try { url = new URL(String(req.url || ''), 'http://localhost'); } catch (_) { return null; }
    const room = String(url.searchParams.get('room') || '');
    if (!room || !this.validate(String(url.searchParams.get('token') || ''), room)) return null;
    const peers = this._rooms.get(room);
    return peers && peers.size >= this._maxPerRoom ? null : room;
  }

  _join(room, ws) {
    const peers = this._rooms.get(room) || new Set();
    const playerId = `p${++this._seq}`;
    peers.add(ws);
    this._rooms.set(room, peers);
    RoomRelay._send(ws, { type: 'welcome', playerId, peers: [...peers].filter((w) => w !== ws).map((w) => w._gmId).filter(Boolean) });
    ws._gmId = playerId;
    for (const w of peers) if (w !== ws) RoomRelay._send(w, { type: 'peer-joined', playerId });
    ws.on('message', (data) => this._relay(peers, ws, playerId, data));
    ws.on('close', () => this._leave(room, peers, ws, playerId));
    ws.on('error', () => {});
  }

  _relay(peers, sender, playerId, data) {
    const raw = String(data);
    if (raw.length > RoomRelay.MAX_MSG_BYTES) return;
    let msg = null;
    try { msg = JSON.parse(raw); } catch (_) { return; }
    if (!msg || typeof msg !== 'object' || Array.isArray(msg)) return;
    msg.from = playerId;
    const out = JSON.stringify(msg);
    for (const w of peers) {
      if (w !== sender && w.readyState === RoomRelay.OPEN) {
        try { w.send(out); } catch (_) {}
      }
    }
  }

  _leave(room, peers, ws, playerId) {
    peers.delete(ws);
    for (const w of peers) RoomRelay._send(w, { type: 'peer-left', playerId });
    if (!peers.size) this._rooms.delete(room);
  }

  static _send(ws, obj) {
    try { ws.send(JSON.stringify(obj)); } catch (_) {}
  }

  static _destroy(socket) {
    try { socket.destroy(); } catch (_) {}
  }
}

module.exports = RoomRelay;
