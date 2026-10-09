const crypto = require('crypto');
const CaptureGrantQueue = require('./CaptureGrantQueue');
const CapturerWindow = require('./CapturerWindow');

class RtcCapturer {
  static CHANNEL = CapturerWindow.CHANNEL;
  static PARTITION = CapturerWindow.PARTITION;
  static RELAYED_KINDS = new Set(['offer', 'cand', 'state', 'error']);

  constructor({ getFrameForTab, log, extensionDir, electron } = {}) {
    this._log = log || (() => {});
    this._extensionDir = extensionDir || __dirname;
    this._electron = electron || null;
    this._window = null;
    this._ready = null;
    this._peers = new Map();
    this._grants = new CaptureGrantQueue({ getFrameForTab, toPage: (msg) => this._toPage(msg), log: this._log });
    this._failed = null;
    this._destroyed = false;
  }

  isAvailable() {
    return !this._destroyed && !this._failed;
  }

  failure() {
    return this._failed;
  }

  hasPeer(peerId) {
    return this._peers.has(peerId);
  }

  async ensure() {
    if (this._destroyed) throw new Error('capturer destroyed');
    if (this._ready) return this._ready;
    this._ready = this._openWindow().catch((err) => {
      this._failed = err && err.message;
      this._log(`capturer unavailable: ${this._failed}`);
      this._ready = null;
      throw err;
    });
    return this._ready;
  }

  createPeer({ tabId, iceServers = [], send }) {
    if (!this.isAvailable()) return null;
    const peer = RtcCapturer._newPeer(tabId, iceServers, send);
    this._peers.set(peer.id, peer);
    this._startPeer(peer);
    return {
      id: peer.id,
      answer: (sdp) => { if (!peer.closed) this._toPage({ k: 'answer', peerId: peer.id, sdp: String(sdp || '') }); },
      candidate: (cand) => { if (!peer.closed) this._toPage({ k: 'cand', peerId: peer.id, cand }); },
      close: () => this.closePeer(peer.id, { notify: false }),
    };
  }

  closePeer(peerId, { notify = true } = {}) {
    const peer = this._peers.get(peerId);
    if (!peer) return;
    peer.closed = true;
    this._peers.delete(peerId);
    if (notify) RtcCapturer._tell(peer, { k: 'state', state: 'closed' });
    this._toPage({ k: 'close', peerId });
  }

  release(tabId) {
    for (const [id, peer] of [...this._peers]) {
      if (peer.tabId !== tabId) continue;
      peer.closed = true;
      this._peers.delete(id);
      RtcCapturer._tell(peer, { k: 'state', state: 'closed' });
    }
    this._toPage({ k: 'release', tabId });
  }

  destroy() {
    this._destroyed = true;
    this._failAllPeers('ended');
    if (this._window) this._window.destroy();
    this._window = null;
    this._ready = null;
  }

  static _newPeer(tabId, iceServers, send) {
    const id = `p_${crypto.randomBytes(4).toString('hex')}`;
    return { id, tabId, send, state: 'new', closed: false, iceServers: Array.isArray(iceServers) ? iceServers : [] };
  }

  _startPeer(peer) {
    this.ensure().then(() => {
      if (peer.closed) return;
      this._toPage({ k: 'create', peerId: peer.id, tabId: peer.tabId, iceServers: [] });
    }).catch((err) => {
      if (peer.closed) return;
      RtcCapturer._tell(peer, { k: 'error', message: err && err.message });
      this._peers.delete(peer.id);
    });
  }

  _openWindow() {
    this._window = new CapturerWindow({
      electron: this._lib(),
      extensionDir: this._extensionDir,
      log: this._log,
      takePendingFrame: () => this._grants.takePendingFrame(),
      onMessage: (msg) => this._onPageMessage(msg),
      onClosed: () => this._onWindowClosed(),
      onRendererGone: (reason) => this._onRendererGone(reason),
    });
    return this._window.open();
  }

  _lib() {
    if (!this._electron) this._electron = require('electron');
    return this._electron;
  }

  _onWindowClosed() {
    this._window = null;
    this._ready = null;
    if (!this._destroyed) this._failed = 'capturer window closed';
    this._failAllPeers('capturer-closed');
  }

  _onRendererGone(reason) {
    this._failed = `capturer renderer gone (${reason})`;
    this._failAllPeers('capturer-gone');
  }

  _toPage(msg) {
    if (this._window) this._window.send(msg);
  }

  _onPageMessage(msg) {
    if (msg.k === 'ready') { if (this._window) this._window.markReady(); }
    else if (msg.k === 'capture-request') this._grants.request(Number(msg.tabId));
    else if (msg.k === 'capture-done') this._grants.done(Number(msg.tabId), !!msg.ok, msg.error);
    else if (RtcCapturer.RELAYED_KINDS.has(msg.k)) this._relayToGuest(msg);
    else if (msg.k === 'log') this._log(`capturer: ${msg.message}`);
  }

  _relayToGuest(msg) {
    const peer = this._peers.get(msg.peerId);
    if (!peer || peer.closed) return;
    if (msg.k === 'state') peer.state = msg.state;
    const out = Object.assign({}, msg);
    delete out.peerId;
    if (msg.k === 'offer') out.iceServers = peer.iceServers;
    RtcCapturer._tell(peer, out);
    if (msg.k === 'state' && (msg.state === 'failed' || msg.state === 'closed')) this.closePeer(msg.peerId, { notify: false });
  }

  _failAllPeers(reason) {
    for (const peer of this._peers.values()) {
      peer.closed = true;
      RtcCapturer._tell(peer, { k: 'error', message: reason });
    }
    this._peers.clear();
  }

  static _tell(peer, msg) {
    try { peer.send(msg); } catch (_) {}
  }
}

module.exports = RtcCapturer;
