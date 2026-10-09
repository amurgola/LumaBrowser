const RtcCapturer = require('./RtcCapturer');
const TurnRelay = require('./TurnRelay');

class TabShareTransport {
  constructor({ settings, getHost, getTvm, log, extensionDir, rtcCapturer, turnRelay } = {}) {
    this._settings = settings;
    this._getHost = getHost || (() => null);
    this._getTvm = getTvm || (() => null);
    this._log = log || (() => {});
    this._extensionDir = extensionDir;
    this._rtc = rtcCapturer || null;
    this._relay = turnRelay || new TurnRelay({ log: this._log });
    this._peerSeq = 0;
  }

  startRelayIfEnabled(onStarted) {
    const values = this._settings.get();
    if (!values.turnEnabled) return;
    this._relay.start({ port: values.turnPort }).then(() => onStarted()).catch(() => {});
  }

  async applyRelay() {
    const values = this._settings.get();
    if (values.turnEnabled) return this._relay.start({ port: values.turnPort });
    await this._relay.stop();
    return { success: true };
  }

  rtcAvailable() {
    if (!this._settings.get().rtcEnabled) return false;
    const rtc = this._capturer();
    return !!(rtc && rtc.isAvailable());
  }

  turnHost() {
    const configured = this._settings.get().turnHost;
    if (configured) return configured;
    const host = this._getHost();
    try {
      const pub = host && host.getWebPublicUrl ? host.getWebPublicUrl() : '';
      if (pub) return new URL(pub).hostname;
    } catch (_) {}
    try { if (host && host.lanAddress) return host.lanAddress(); } catch (_) {}
    return '127.0.0.1';
  }

  status() {
    const values = this._settings.get();
    return {
      enabled: !!values.rtcEnabled,
      available: this.rtcAvailable(),
      error: this._rtc ? this._rtc.failure() : null,
      turn: { enabled: !!values.turnEnabled, host: this.turnHost(), ...this._relay.getStatus() },
    };
  }

  hooksFor(share) {
    return {
      available: () => this.rtcAvailable() && share.tabId != null,
      createPeer: (send) => this._createPeer(share, send),
    };
  }

  release(tabId) {
    if (this._rtc && tabId != null) this._rtc.release(tabId);
  }

  destroy() {
    if (this._rtc) { try { this._rtc.destroy(); } catch (_) {} this._rtc = null; }
    try { this._relay.stop(); } catch (_) {}
  }

  _createPeer(share, send) {
    const rtc = this._capturer();
    if (!rtc || share.tabId == null) return null;
    const peerKey = `${share.id}:${++this._peerSeq}`;
    const peer = rtc.createPeer({ tabId: share.tabId, iceServers: this._iceServersFor(peerKey), send });
    if (!peer) { this._relay.revoke(peerKey); return null; }
    return {
      answer: peer.answer,
      candidate: peer.candidate,
      close: () => { this._relay.revoke(peerKey); peer.close(); },
    };
  }

  _iceServersFor(peerKey) {
    if (!this._settings.get().turnEnabled || !this._relay.isRunning()) return [];
    return [this._relay.issueCredentials(peerKey, { host: this.turnHost(), port: this._relay.getPort() })];
  }

  _capturer() {
    if (this._rtc) return this._rtc;
    try {
      this._rtc = new RtcCapturer({ extensionDir: this._extensionDir, log: this._log, getFrameForTab: (tabId) => this._frameFor(tabId) });
    } catch (err) {
      this._log(`optimized stream unavailable: ${err && err.message}`);
      this._rtc = null;
    }
    return this._rtc;
  }

  _frameFor(tabId) {
    const tvm = this._getTvm();
    const entry = tvm && tvm.getEntry ? tvm.getEntry(tabId) : null;
    const wc = entry && entry.webContents;
    if (!wc || (typeof wc.isDestroyed === 'function' && wc.isDestroyed())) return null;
    return wc.mainFrame || null;
  }
}

module.exports = TabShareTransport;
