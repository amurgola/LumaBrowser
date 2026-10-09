class PeerProviderConfigs {
  static CONFIGS_KEY = 'llm.providerConfigs';
  static DEFAULT_PROVIDER_KEY = 'llm.provider';
  static NO_PROVIDER = 'none';

  constructor(db) {
    this._db = db;
  }

  static configId(peerId) {
    return `peer:${peerId}:llm`;
  }

  register(peer) {
    const all = this._readAll();
    const previous = all.find((config) => PeerProviderConfigs._ownedBy(config, peer.id));
    const kept = all.filter((config) => !PeerProviderConfigs._ownedBy(config, peer.id));
    const next = this._nextConfig(peer, previous);
    if (next) kept.push(next);
    this._db.set(PeerProviderConfigs.CONFIGS_KEY, kept);
  }

  unregister(peerId) {
    const all = this._readAll();
    const removedIds = all.filter((config) => PeerProviderConfigs._ownedBy(config, peerId)).map((config) => config.id);
    this._db.set(PeerProviderConfigs.CONFIGS_KEY, all.filter((config) => !PeerProviderConfigs._ownedBy(config, peerId)));
    this._clearDanglingDefault(removedIds);
  }

  _nextConfig(peer, previous) {
    const llms = (peer.manifest && peer.manifest.llms) || [];
    if (!llms.length) return previous || null;
    return {
      id: PeerProviderConfigs.configId(peer.id),
      name: `${peer.name} (shared)`,
      type: 'openai',
      endpoint: `${peer.endpoint}/sharing/llm`,
      apiKey: peer.token,
      selectedModel: PeerProviderConfigs._selectedModel(llms, previous),
      models: llms.map((model) => PeerProviderConfigs._model(model)),
      peerId: peer.id,
      peerManaged: true,
    };
  }

  static _selectedModel(llms, previous) {
    const refs = llms.map((model) => model.ref);
    return previous && refs.includes(previous.selectedModel) ? previous.selectedModel : llms[0].ref;
  }

  static _model(model) {
    const context = Number(model.contextWindow);
    return {
      id: model.ref,
      luma_label: model.label,
      ...(context > 0 ? { luma_context: Math.floor(context) } : {}),
    };
  }

  _clearDanglingDefault(removedIds) {
    const current = this._db.get(PeerProviderConfigs.DEFAULT_PROVIDER_KEY, PeerProviderConfigs.NO_PROVIDER);
    if (removedIds.includes(current)) this._db.set(PeerProviderConfigs.DEFAULT_PROVIDER_KEY, PeerProviderConfigs.NO_PROVIDER);
  }

  _readAll() {
    return this._db.get(PeerProviderConfigs.CONFIGS_KEY, []) || [];
  }

  static _ownedBy(config, peerId) {
    return !!config && config.peerId === peerId;
  }
}

module.exports = PeerProviderConfigs;
