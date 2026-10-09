class TabViewer {
  static INPUT_RATE_PER_SEC = 240;
  static BACKLOG_FRAMES = 3;

  constructor(ws) {
    this._ws = ws;
    this._onVideo = false;
    this._peer = null;
    this._rate = { sec: 0, n: 0 };
  }

  socket() {
    return this._ws;
  }

  sendJson(obj) {
    this.sendText(JSON.stringify(obj));
  }

  sendText(text) {
    try { this._ws.send(text); } catch (_) {}
  }

  sendFrame(jpeg) {
    try { this._ws.send(jpeg, { binary: true }); } catch (_) {}
  }

  isBackedUp(frameBytes) {
    return this._ws.bufferedAmount > frameBytes * TabViewer.BACKLOG_FRAMES;
  }

  close(code, reason) {
    try { this._ws.close(code, reason); } catch (_) {}
  }

  isOnVideo() {
    return this._onVideo;
  }

  setOnVideo(on) {
    this._onVideo = !!on;
  }

  hasPeer() {
    return !!this._peer;
  }

  peer() {
    return this._peer;
  }

  attachPeer(peer) {
    this._peer = peer;
  }

  detachPeer() {
    const peer = this._peer;
    this._peer = null;
    return peer;
  }

  closePeer() {
    const peer = this.detachPeer();
    if (peer) { try { peer.close(); } catch (_) {} }
    this._onVideo = false;
  }

  allowInput(now = Date.now()) {
    const sec = Math.floor(now / 1000);
    if (this._rate.sec !== sec) this._rate = { sec, n: 0 };
    this._rate.n++;
    return this._rate.n <= TabViewer.INPUT_RATE_PER_SEC;
  }
}

module.exports = TabViewer;
