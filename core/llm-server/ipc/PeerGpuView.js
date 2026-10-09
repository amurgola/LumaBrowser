const RpcPeers = require('../server/RpcPeers');

class PeerGpuView {
  static view({ client = global.__lumaSharingClientService, rpcPeers = RpcPeers } = {}) {
    const peers = client && client.getAttachedGpuPeers ? client.getAttachedGpuPeers() : [];
    return {
      peers: peers.map((p) => ({ id: p.id, name: p.name, devices: p.devices })),
      active: rpcPeers.isActive(),
      activePeers: rpcPeers.activePeers(),
    };
  }
}

module.exports = PeerGpuView;
