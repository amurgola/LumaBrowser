class PeerImageServers {
  static ROLES = [
    { role: 'image-generate', slot: 'generate', kind: 'generate', label: 'Image Generation' },
    { role: 'image-edit', slot: 'edit', kind: 'edit', label: 'Image Editor' },
  ];

  constructor(imageServerService, peerStore) {
    this._service = imageServerService || null;
    this._peers = peerStore;
  }

  static serverId(peerId, role) {
    return `peer:${peerId}:${role}`;
  }

  register(peer) {
    if (!this._service || typeof this._service.upsertRemoteServer !== 'function') return;
    const previousById = this._snapshotServers();
    const previousActive = this._snapshotActive();
    this._removeForPeer(peer.id);
    const offered = this._upsertOffered(peer, previousById);
    this._restoreActive(peer.id, offered, previousActive);
    this._adoptOnce(peer, offered);
  }

  unregister(peerId) {
    if (this._service) this._removeForPeer(peerId);
  }

  _snapshotServers() {
    const byId = new Map();
    if (typeof this._service.getRemoteServerConfigs !== 'function') return byId;
    try {
      for (const server of this._service.getRemoteServerConfigs()) byId.set(server.id, server);
    } catch (_) {}
    return byId;
  }

  _snapshotActive() {
    const active = {};
    if (typeof this._service.getActiveServerId !== 'function') return active;
    for (const { role } of PeerImageServers.ROLES) {
      try { active[role] = this._service.getActiveServerId(role); } catch (_) {}
    }
    return active;
  }

  _removeForPeer(peerId) {
    try { this._service.removeServersForPeer(peerId); } catch (_) {}
  }

  _upsertOffered(peer, previousById) {
    const image = (peer.manifest && peer.manifest.image) || {};
    const offered = [];
    for (const entry of PeerImageServers.ROLES) {
      const slot = image[entry.slot];
      if (!slot || !slot.available) continue;
      this._service.upsertRemoteServer(PeerImageServers._server(peer, entry, slot, previousById));
      offered.push(entry.role);
    }
    return offered;
  }

  static _server(peer, entry, slot, previousById) {
    const id = PeerImageServers.serverId(peer.id, entry.role);
    const models = PeerImageServers._slotModels(slot);
    return {
      id,
      name: `${peer.name} · ${entry.label} (shared)`,
      kind: entry.kind,
      endpoint: `${peer.endpoint}/sharing/image`,
      token: peer.token,
      peerId: peer.id,
      peerManaged: true,
      models,
      modelLabel: slot.modelLabel || null,
      selectedModel: PeerImageServers._keptSelection(previousById.get(id), models),
    };
  }

  static _slotModels(slot) {
    if (!Array.isArray(slot.models)) return null;
    return slot.models.filter((model) => model && model.id).map((model) => ({ id: model.id, label: model.label || model.id }));
  }

  static _keptSelection(previous, models) {
    const wanted = previous && previous.selectedModel;
    return wanted && Array.isArray(models) && models.some((model) => model.id === wanted) ? wanted : null;
  }

  _restoreActive(peerId, offered, previousActive) {
    if (typeof this._service.setActiveServerId !== 'function') return;
    for (const role of offered) {
      const id = PeerImageServers.serverId(peerId, role);
      if (previousActive[role] !== id) continue;
      try { this._service.setActiveServerId(role, id); } catch (_) {}
    }
  }

  _adoptOnce(peer, offered) {
    if (typeof this._service.setActiveServerId !== 'function' || peer._imageServersAdopted) return;
    try {
      for (const role of offered) this._service.setActiveServerId(role, PeerImageServers.serverId(peer.id, role));
      this._peers.patch(peer.id, { _imageServersAdopted: true });
    } catch (_) {}
  }
}

module.exports = PeerImageServers;
