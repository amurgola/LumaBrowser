class PeerView {
  static toPublic(peer) {
    const manifest = peer.manifest || {};
    const image = manifest.image || {};
    return {
      id: peer.id,
      name: peer.name,
      endpoint: peer.endpoint,
      addedAt: peer.addedAt,
      lastSeenAt: peer.lastSeenAt || null,
      enabled: peer.enabled !== false,
      online: peer.online !== false,
      secure: PeerView.isSecure(peer),
      tlsFingerprint: peer.tlsFingerprint || null,
      error: peer.error || null,
      llmCount: manifest.llms ? manifest.llms.length : 0,
      imageGen: !!(image.generate && image.generate.available),
      imageEdit: !!(image.edit && image.edit.available),
      gpuCount: PeerView.hasGpus(peer) ? manifest.gpus.devices.length : 0,
      gpusBusy: !!(manifest.gpus && manifest.gpus.busy),
      gpusAttached: !!peer.gpusAttached,
    };
  }

  static isSecure(peer) {
    return !!peer.tlsFingerprint || /^https:/i.test(peer.endpoint || '');
  }

  static hasGpus(peer) {
    const gpus = peer.manifest && peer.manifest.gpus;
    return !!(gpus && gpus.available && Array.isArray(gpus.devices) && gpus.devices.length);
  }

  static attachedGpuPeers(peers) {
    return peers
      .filter((peer) => peer.enabled !== false && peer.gpusAttached && peer.online !== false && PeerView.hasGpus(peer))
      .map((peer) => ({ id: peer.id, name: peer.name, endpoint: peer.endpoint, devices: PeerView._devices(peer) }));
  }

  static gpuPeerDevices(peers) {
    return peers
      .filter((peer) => peer.enabled !== false && PeerView.hasGpus(peer))
      .map((peer) => ({
        id: peer.id,
        name: peer.name,
        online: peer.online !== false,
        attached: !!peer.gpusAttached,
        busy: !!peer.manifest.gpus.busy,
        devices: PeerView._devices(peer),
      }));
  }

  static _devices(peer) {
    return peer.manifest.gpus.devices.map((device) => ({
      index: device.index,
      name: device.name,
      vramTotalMB: Number(device.vramTotalMB) || 0,
      vramFreeMB: Number(device.vramFreeMB) || 0,
    }));
  }
}

module.exports = PeerView;
