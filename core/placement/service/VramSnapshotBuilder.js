const PlacementLayout = require('../../shared/runtime/PlacementLayout');
const RemoteDeviceRef = require('../../shared/runtime/placement/RemoteDeviceRef');
const BestEffort = require('./BestEffort');

const MIB = 1024 * 1024;

class VramSnapshotBuilder {
  constructor({ servers, gpu, vram, getSharingClient }) {
    this._servers = servers;
    this._gpu = gpu;
    this._vram = vram;
    this._getSharingClient = getSharingClient;
  }

  build() {
    const ledger = this._vram.snapshot();
    const apps = BestEffort.read(() => this._gpu.readComputeApps()) || {};
    return {
      devices: this._localDevices(),
      remoteDevices: this._remoteDevices(),
      servers: this._serverSlots(ledger, apps),
    };
  }

  _localDevices() {
    const devices = BestEffort.read(() => this._gpu.readDevices(null)) || [];
    return devices.map((d) => ({ index: d.index, name: d.name, totalBytes: d.totalBytes, freeBytes: d.freeBytes }));
  }

  _remoteDevices() {
    try {
      const sharing = this._getSharingClient();
      const peers = sharing && typeof sharing.getGpuPeerDevices === 'function' ? sharing.getGpuPeerDevices() : [];
      return peers.flatMap((peer) => (peer.devices || []).map((device) => VramSnapshotBuilder._remoteDevice(peer, device)));
    } catch (_) {
      return [];
    }
  }

  _serverSlots(ledger, apps) {
    const servers = this._servers;
    const image = servers.imageDefaults();
    const slot = (item, modelId, available = true) => VramSnapshotBuilder._slot({
      serverId: PlacementLayout.ITEM_TO_SERVER[item], modelId, status: servers.status(item), available, ledger, apps,
    });
    return {
      llm: slot('llm', servers.llmModelLabel()),
      imageGenerate: slot('imageGenerate', image.modelId),
      imageEdit: slot('imageEdit', image.editModelId),
      imageVideo: slot('imageVideo', image.videoModelId),
      music: slot('music', servers.musicDefaults().modelId,
        !!BestEffort.read(() => servers.music.isPlatformSupported() && servers.music.isEnabled())),
      grounding: slot('grounding', BestEffort.read(() => servers.grounding.getView().modelName) || null,
        !!BestEffort.read(() => servers.grounding.isConfigured())),
    };
  }

  static _slot({ serverId, modelId, status, available, ledger, apps }) {
    const claim = ledger[serverId];
    const plan = status && status.plan;
    const pid = status && status.pid != null ? status.pid : null;
    return {
      modelId: modelId || null,
      available: !!available,
      state: status ? status.state : 'idle',
      devices: (claim && claim.devices) || [],
      offloadToCpu: !!(plan && plan.offloadToCpu),
      vaeTiling: !!(plan && plan.vaeTiling),
      pid,
      usedBytes: pid != null && apps[pid] != null ? apps[pid] : null,
      estBytes: (claim && claim.bytes) || null,
      contextSize: (plan && plan.contextSize) || null,
    };
  }

  static _remoteDevice(peer, device) {
    return {
      ref: RemoteDeviceRef.format(peer.id, device.index),
      peerId: peer.id,
      peerName: peer.name,
      index: device.index,
      name: device.name || null,
      totalBytes: (Number(device.vramTotalMB) || 0) * MIB,
      freeBytes: (Number(device.vramFreeMB) || 0) * MIB,
      online: !!peer.online,
      attached: !!peer.attached,
      busy: !!peer.busy,
    };
  }
}

module.exports = VramSnapshotBuilder;
