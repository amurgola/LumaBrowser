const os = require('os');
const PinnedTls = require('../tls/PinnedTls');
const PeerStore = require('./PeerStore');
const PeerView = require('./PeerView');
const PeerAddress = require('./PeerAddress');
const PeerApi = require('./PeerApi');
const PeerTlsUpgrade = require('./PeerTlsUpgrade');
const PeerPoller = require('./PeerPoller');
const PeerProviderConfigs = require('./PeerProviderConfigs');
const PeerImageServers = require('./PeerImageServers');
const PeerDiscovery = require('./PeerDiscovery');

class SharingClientService {
  constructor({ db, imageServerService, hostService, onResourcesChanged } = {}) {
    if (!db) throw new Error('SharingClientService requires a SettingsDatabase');
    this._hostService = hostService || null;
    this._peers = new PeerStore(db);
    this._providerConfigs = new PeerProviderConfigs(db);
    this._imageServers = new PeerImageServers(imageServerService, this._peers);
    this._discovery = new PeerDiscovery({ getSelfId: () => this._selfId() });
    this._poller = this._createPoller();
    this.setResourcesChangedNotifier(onResourcesChanged);
    this._loadPins();
  }

  setResourcesChangedNotifier(fn) {
    this._onResourcesChanged = typeof fn === 'function' ? fn : null;
  }

  listPeers() {
    return this._peers.all().map((peer) => PeerView.toPublic(peer));
  }

  async probe(address, port) {
    const base = PeerAddress.baseUrl(address, port || PeerAddress.DEFAULT_PORT);
    if (!base) return { success: false, error: 'Invalid address.' };
    return PeerApi.info(base);
  }

  async pair(address, pin, { port } = {}) {
    const probe = await this.probe(address, port);
    if (!probe.success) return probe;
    if (this._isSelf(probe.info)) return { success: false, error: 'That host is this same computer.' };
    const upgrade = await PeerTlsUpgrade.resolve(probe.base, probe.info);
    if (!upgrade.success) return upgrade;
    const base = upgrade.base || probe.base;
    const paired = await PeerApi.pair(base, pin, this._selfName());
    if (!paired.success) return paired;
    return this._savePairedPeer(probe.info, base, paired.token, upgrade.pin || null);
  }

  async refreshPeer(id) {
    try { await this._upgradeTls(id); } catch (_) {}
    const peers = this._peers.all();
    const peer = peers.find((p) => p.id === id);
    if (!peer) return { success: false, error: 'Peer not found.' };
    const result = await PeerApi.fetchManifest(peer);
    if (!result.success) return this._recordRefreshFailure(peers, peer, result.error);
    this._recordRefreshSuccess(peers, peer, result.manifest);
    return { success: true, peer: this._publicPeer(id) };
  }

  startPolling(intervalMs = PeerPoller.POLL_INTERVAL_MS) {
    this._poller.start(intervalMs);
  }

  stopPolling() {
    this._poller.stop();
  }

  setPeerEnabled(id, enabled) {
    const peers = this._peers.all();
    const peer = peers.find((p) => p.id === id);
    if (!peer) return { success: false, error: 'Peer not found.' };
    peer.enabled = !!enabled;
    this._peers.writeAll(peers);
    if (peer.enabled && peer.manifest) this._registerResources(peer);
    else this._unregisterResources(peer.id);
    return { success: true };
  }

  removePeer(id) {
    const peer = this._peers.find(id);
    if (peer && peer.endpoint) PinnedTls.removePin(peer.endpoint);
    this._unregisterResources(id);
    this._peers.remove(id);
    return { success: true };
  }

  setPeerGpusAttached(id, attached) {
    if (!this._peers.find(id)) return { success: false, error: 'Peer not found.' };
    this._peers.patch(id, { gpusAttached: !!attached });
    return { success: true, gpusAttached: !!attached };
  }

  getAttachedGpuPeers() {
    return PeerView.attachedGpuPeers(this._peers.all());
  }

  getGpuPeerDevices() {
    return PeerView.gpuPeerDevices(this._peers.all());
  }

  async rpcAcquire(id, { devices } = {}) {
    const peer = this._peers.find(id);
    if (!peer) return { success: false, error: 'Peer not found.' };
    return PeerApi.rpcAcquire(peer, devices);
  }

  async rpcHeartbeat(id) {
    const peer = this._peers.find(id);
    if (!peer) return { success: false, gone: true };
    return PeerApi.rpcHeartbeat(peer);
  }

  async rpcRelease(id) {
    const peer = this._peers.find(id);
    if (!peer) return { success: true };
    return PeerApi.rpcRelease(peer);
  }

  startDiscovery() {
    this._discovery.start();
  }

  stopDiscovery() {
    this._discovery.stop();
  }

  getDiscovered() {
    return this._discovery.list(new Set(this._peers.all().map((peer) => peer.id)));
  }

  async shutdown() {
    this.stopPolling();
    this.stopDiscovery();
  }

  _createPoller() {
    return new PeerPoller({
      peerStore: this._peers,
      fetchManifest: (peer) => PeerApi.fetchManifest(peer),
      upgradeTls: (peerId) => this._upgradeTls(peerId),
      register: (peer) => this._registerResources(peer),
      notify: () => { if (this._onResourcesChanged) this._onResourcesChanged(); },
    });
  }

  _loadPins() {
    for (const peer of this._peers.all()) {
      if (peer && peer.endpoint && peer.certPem && peer.tlsFingerprint) {
        PinnedTls.setPin(peer.endpoint, { certPem: peer.certPem, fingerprint256: peer.tlsFingerprint });
      }
    }
  }

  async _savePairedPeer(info, base, token, tlsPin) {
    const peer = SharingClientService._newPeer(info, base, token, tlsPin);
    const result = await PeerApi.fetchManifest(peer);
    if (result.success) peer.manifest = result.manifest;
    else peer.error = result.error;
    this._peers.upsert(peer);
    if (peer.manifest) this._registerResources(peer);
    return { success: true, peer: this._publicPeer(peer.id) };
  }

  static _newPeer(info, base, token, tlsPin) {
    const now = new Date().toISOString();
    return {
      id: info.id || base,
      name: info.name || base,
      endpoint: base,
      token,
      certPem: tlsPin ? tlsPin.certPem : null,
      tlsFingerprint: tlsPin ? tlsPin.fingerprint256 : null,
      addedAt: now,
      lastSeenAt: now,
      manifest: null,
      enabled: true,
      error: null,
    };
  }

  _recordRefreshFailure(peers, peer, error) {
    peer.error = error;
    peer.lastSeenAt = peer.lastSeenAt || null;
    this._peers.writeAll(peers);
    return { success: false, error };
  }

  _recordRefreshSuccess(peers, peer, manifest) {
    peer.manifest = manifest;
    peer.error = null;
    peer.lastSeenAt = new Date().toISOString();
    this._peers.writeAll(peers);
    if (peer.enabled !== false) this._registerResources(peer);
  }

  async _upgradeTls(peerId) {
    const peer = this._peers.find(peerId);
    if (!peer || peer.tlsFingerprint || !/^http:/i.test(peer.endpoint || '')) return false;
    const probe = await this.probe(peer.endpoint);
    if (!probe.success) return false;
    const upgrade = await PeerTlsUpgrade.resolve(probe.base, probe.info);
    if (!upgrade.success || !upgrade.base) return false;
    this._peers.patch(peerId, { endpoint: upgrade.base, certPem: upgrade.pin.certPem, tlsFingerprint: upgrade.pin.fingerprint256 });
    this._reregisterAfterUpgrade(peerId);
    console.log(`[sharing] peer ${peer.name || peerId} upgraded to encrypted endpoint ${upgrade.base}`);
    return true;
  }

  _reregisterAfterUpgrade(peerId) {
    const fresh = this._peers.find(peerId);
    if (fresh && fresh.enabled !== false && fresh.manifest) this._registerResources(fresh);
  }

  _registerResources(peer) {
    this._providerConfigs.register(peer);
    this._imageServers.register(peer);
  }

  _unregisterResources(peerId) {
    this._providerConfigs.unregister(peerId);
    this._imageServers.unregister(peerId);
  }

  _publicPeer(id) {
    return this.listPeers().find((peer) => peer.id === id) || null;
  }

  _isSelf(info) {
    return !!(this._hostService && info.id && info.id === this._hostService.instanceId);
  }

  _selfId() {
    return this._hostService ? this._hostService.instanceId : null;
  }

  _selfName() {
    try {
      return (this._hostService && this._hostService.getInstanceName()) || os.hostname();
    } catch (_) {
      return 'LumaBrowser';
    }
  }
}

module.exports = SharingClientService;
