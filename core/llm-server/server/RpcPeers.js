class RpcPeers {
  static HEARTBEAT_MS = 20 * 1000;
  static BUSY_RETRY_DELAY_MS = 3000;
  static _MB = 1024 * 1024;

  static _active = [];
  static _beatTimer = null;

  static async acquireForLaunch({ want } = {}) {
    const result = { servers: [], skipped: [] };
    const service = RpcPeers._clientService();
    if (!service) return result;
    const peers = RpcPeers._resolvePeers(service, want, result.skipped);
    for (const peer of peers) await RpcPeers._borrowPeer(service, peer, result);
    if (RpcPeers._active.length) RpcPeers._startHeartbeat();
    return result;
  }

  static isActive() {
    return RpcPeers._active.length > 0;
  }

  static activePeers() {
    return RpcPeers._active.map((lease) => ({ ...lease }));
  }

  static async releaseAll() {
    const service = RpcPeers._clientService();
    const toRelease = RpcPeers._active.splice(0);
    RpcPeers._stopHeartbeat();
    for (const lease of toRelease) {
      try { if (service) await service.rpcRelease(lease.peerId); } catch (_) {}
    }
  }

  static _clientService() {
    return global.__lumaSharingClientService || null;
  }

  static _resolvePeers(service, want, skipped) {
    if (Array.isArray(want) && want.length) return RpcPeers._resolveWantedPeers(service, want, skipped);
    return typeof service.getAttachedGpuPeers === 'function' ? service.getAttachedGpuPeers() : [];
  }

  static _resolveWantedPeers(service, want, skipped) {
    const all = typeof service.getGpuPeerDevices === 'function' ? service.getGpuPeerDevices() : [];
    const peers = [];
    for (const wanted of want) {
      const peer = RpcPeers._resolveWantedPeer(all, wanted, skipped);
      if (peer) peers.push(peer);
    }
    return peers;
  }

  static _resolveWantedPeer(all, wanted, skipped) {
    const peer = all.find((candidate) => candidate.id === wanted.peerId);
    if (!peer) return RpcPeers._skip(skipped, String(wanted.peerId), 'peer no longer paired');
    if (!peer.online) return RpcPeers._skip(skipped, peer.name, 'offline');
    const known = new Set((peer.devices || []).map((device) => device.index));
    const wantDevices = (Array.isArray(wanted.devices) ? wanted.devices : []).filter((index) => known.has(index));
    if (!wantDevices.length) return RpcPeers._skip(skipped, peer.name, 'requested GPUs not advertised');
    return { id: peer.id, name: peer.name, devices: peer.devices, wantDevices };
  }

  static _skip(skipped, name, reason) {
    skipped.push({ name, reason });
    return null;
  }

  static async _borrowPeer(service, peer, result) {
    const response = await RpcPeers._acquireWithRetry(service, peer);
    if (!response.success) {
      const reason = response.busy ? 'busy (in use by another machine)' : (response.error || 'unreachable');
      RpcPeers._skip(result.skipped, peer.name, reason);
      return;
    }
    result.servers.push(RpcPeers._toServer(peer, response));
    RpcPeers._active.push({ peerId: peer.id, addr: response.addr, label: peer.name });
  }

  static async _acquireWithRetry(service, peer) {
    const options = peer.wantDevices ? { devices: peer.wantDevices } : {};
    const response = await service.rpcAcquire(peer.id, options);
    if (response.success || !response.busy) return response;
    await new Promise((resolve) => setTimeout(resolve, RpcPeers.BUSY_RETRY_DELAY_MS));
    return service.rpcAcquire(peer.id, options);
  }

  static _toServer(peer, response) {
    const counted = RpcPeers._countedDevices(peer, response);
    return {
      addr: response.addr,
      label: peer.name,
      peerId: peer.id,
      totalBytes: counted.reduce((sum, device) => sum + device.vramTotalMB * RpcPeers._MB, 0),
      freeBytes: counted.reduce((sum, device) => sum + device.vramFreeMB * RpcPeers._MB, 0),
      devices: counted.map((device) => RpcPeers._toDevice(device)),
    };
  }

  static _countedDevices(peer, response) {
    if (Array.isArray(response.devicesInfo) && response.devicesInfo.length) return response.devicesInfo;
    const lent = new Set(response.devices || []);
    return peer.devices.filter((device) => !lent.size || lent.has(device.index));
  }

  static _toDevice(device) {
    return {
      index: device.index,
      name: device.name || null,
      totalBytes: (Number(device.vramTotalMB) || 0) * RpcPeers._MB,
      freeBytes: (Number(device.vramFreeMB) || 0) * RpcPeers._MB,
    };
  }

  static _startHeartbeat() {
    if (RpcPeers._beatTimer) return;
    RpcPeers._beatTimer = setInterval(() => RpcPeers._beat(), RpcPeers.HEARTBEAT_MS);
    if (RpcPeers._beatTimer.unref) RpcPeers._beatTimer.unref();
  }

  static async _beat() {
    const service = RpcPeers._clientService();
    if (!service || !RpcPeers._active.length) return RpcPeers._stopHeartbeat();
    for (const lease of RpcPeers._active.slice()) await RpcPeers._beatLease(service, lease);
    if (!RpcPeers._active.length) RpcPeers._stopHeartbeat();
  }

  static async _beatLease(service, lease) {
    try {
      const response = await service.rpcHeartbeat(lease.peerId);
      if (response && response.gone) RpcPeers._dropGoneLease(lease);
    } catch (_) {}
  }

  static _dropGoneLease(lease) {
    RpcPeers._active = RpcPeers._active.filter((entry) => entry !== lease);
    console.warn(`[llm-server] peer GPU lease on ${lease.label} is gone; the running server may degrade on next load.`);
  }

  static _stopHeartbeat() {
    if (!RpcPeers._beatTimer) return;
    clearInterval(RpcPeers._beatTimer);
    RpcPeers._beatTimer = null;
  }
}

module.exports = RpcPeers;
