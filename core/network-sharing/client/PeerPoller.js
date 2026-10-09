const ManifestSignature = require('./ManifestSignature');

class PeerPoller {
  static POLL_INTERVAL_MS = 15000;
  static MAX_BACKOFF_MS = 5 * 60 * 1000;
  static MAX_BACKOFF_DOUBLINGS = 5;
  static OFFLINE_MESSAGE = 'Offline: host unreachable.';
  static CONNECTION_FAILURE = /(etimedout|econnrefused|enetunreach|ehostunreach|enotfound|timeout|socket hang up|network|fetch failed|econnreset)/;

  constructor({ peerStore, fetchManifest, upgradeTls, register, notify }) {
    this._peers = peerStore;
    this._fetchManifest = fetchManifest;
    this._upgradeTls = upgradeTls;
    this._register = register;
    this._notify = notify;
    this._timer = null;
    this._polling = false;
    this._tlsUpgradeTried = new Set();
  }

  start(intervalMs = PeerPoller.POLL_INTERVAL_MS) {
    if (this._timer) return;
    this._peers.resetBackoff();
    const tick = () => { this.pollOnce().catch(() => {}); };
    this._timer = setInterval(tick, intervalMs);
    if (this._timer.unref) this._timer.unref();
    tick();
  }

  stop() {
    if (!this._timer) return;
    clearInterval(this._timer);
    this._timer = null;
  }

  async pollOnce() {
    if (this._polling) return;
    this._polling = true;
    let changed = false;
    try {
      changed = await this._pollEnabledPeers();
    } finally {
      this._polling = false;
    }
    if (changed) this._notifySafely();
  }

  static friendlyError(raw) {
    const message = String(raw || '').toLowerCase();
    if (message.includes('token') || message.includes('re-pair') || message.includes('401')) return raw;
    if (PeerPoller.CONNECTION_FAILURE.test(message)) return PeerPoller.OFFLINE_MESSAGE;
    return raw || 'Could not reach host.';
  }

  static backoffMs(failCount) {
    const doublings = Math.min(failCount - 1, PeerPoller.MAX_BACKOFF_DOUBLINGS);
    return Math.min(PeerPoller.MAX_BACKOFF_MS, PeerPoller.POLL_INTERVAL_MS * 2 ** doublings);
  }

  async _pollEnabledPeers() {
    const now = Date.now();
    let changed = false;
    for (const peer of this._peers.all().filter((p) => p.enabled !== false)) {
      if (peer._nextAttemptAt && now < peer._nextAttemptAt) continue;
      if (await this._offerTlsUpgradeOnce(peer)) changed = true;
      if (await this._pollPeer(peer)) changed = true;
    }
    return changed;
  }

  async _offerTlsUpgradeOnce(peer) {
    if (peer.tlsFingerprint || !/^http:/i.test(peer.endpoint || '') || this._tlsUpgradeTried.has(peer.id)) return false;
    this._tlsUpgradeTried.add(peer.id);
    try {
      if (!(await this._upgradeTls(peer.id))) return false;
      const upgraded = this._peers.find(peer.id);
      if (!upgraded) return false;
      peer.endpoint = upgraded.endpoint;
      return true;
    } catch (_) {
      return false;
    }
  }

  async _pollPeer(peer) {
    const result = await this._fetchManifest(peer);
    if (!result.success) {
      this._recordFailure(peer, result.error);
      return false;
    }
    return this._recordSuccess(peer, result.manifest);
  }

  _recordFailure(peer, error) {
    const failCount = (peer._failCount || 0) + 1;
    this._peers.patch(peer.id, {
      error: PeerPoller.friendlyError(error),
      online: false,
      _failCount: failCount,
      _nextAttemptAt: Date.now() + PeerPoller.backoffMs(failCount),
    });
  }

  _recordSuccess(peer, manifest) {
    const changed = ManifestSignature.of(peer.manifest) !== ManifestSignature.of(manifest);
    const cameBackOnline = peer.online === false;
    this._peers.patch(peer.id, {
      manifest, error: null, online: true, lastSeenAt: new Date().toISOString(), _failCount: 0, _nextAttemptAt: 0,
    });
    if (!changed && !cameBackOnline) return false;
    return this._reregister(peer.id);
  }

  _reregister(peerId) {
    const fresh = this._peers.find(peerId);
    if (!fresh || fresh.enabled === false) return false;
    this._register(fresh);
    return true;
  }

  _notifySafely() {
    try { this._notify(); } catch (_) {}
  }
}

module.exports = PeerPoller;
