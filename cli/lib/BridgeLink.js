class BridgeLink {
  constructor(ws) {
    this.ws = ws;
  }

  send(type, payload) {
    return this.ws.sendJson({ type, payload: payload || {} });
  }

  onFrame(fn) {
    this.ws.on('message', (raw) => {
      const frame = BridgeLink.parse(raw);
      if (frame) fn(frame.type, frame.payload);
    });
  }

  onClose(fn) {
    this.ws.on('close', fn);
  }

  close() {
    this.ws.close();
  }

  static parse(raw) {
    let f;
    try { f = JSON.parse(raw); } catch (_) { return null; }
    return f && typeof f.type === 'string' ? f : null;
  }
}

module.exports = BridgeLink;
