const JsonCollectionStore = require('../../database/JsonCollectionStore');

class RemoteImageServerStore extends JsonCollectionStore {
  static STORAGE_KEY = 'core.imageServer.serverConfigs';
  static NOT_FOUND = 'Remote image server not found.';
  static NOT_OFFERED = 'That model is not offered by this server.';

  constructor(settingsDb) {
    super(settingsDb, { storageKey: RemoteImageServerStore.STORAGE_KEY, entity: 'server' });
  }

  list() {
    return super.list().filter(RemoteImageServerStore._isRemote);
  }

  save(list) {
    const clean = (Array.isArray(list) ? list : [])
      .filter((s) => RemoteImageServerStore._isRemote(s) && s.endpoint)
      .map(RemoteImageServerStore._clean)
      .filter((s) => s.id);
    this._writeAll(clean);
    return clean;
  }

  upsert(entry) {
    const others = this.list().filter((s) => s.id !== (entry && entry.id));
    return this.save([...others, { ...entry, location: 'remote' }]);
  }

  setSelectedModel(id, modelId) {
    const list = this.list();
    const entry = list.find((s) => s.id === id);
    if (!entry) return { success: false, error: RemoteImageServerStore.NOT_FOUND };
    const clean = modelId ? String(modelId) : null;
    if (clean && !RemoteImageServerStore._offers(entry, clean)) return { success: false, error: RemoteImageServerStore.NOT_OFFERED };
    entry.selectedModel = clean;
    this.save(list);
    return { success: true, selectedModel: clean };
  }

  remove(id) {
    return this.save(this.list().filter((s) => s.id !== id));
  }

  idsForPeer(peerId) {
    return this.list().filter((s) => s.peerId === peerId).map((s) => s.id);
  }

  static _isRemote(entry) {
    return !!entry && !entry.managedByCore && entry.location === 'remote';
  }

  static _offers(entry, modelId) {
    if (!Array.isArray(entry.models) || !entry.models.length) return true;
    return entry.models.some((m) => m && m.id === modelId);
  }

  static _clean(s) {
    return {
      id: String(s.id || ''),
      name: String(s.name || s.endpoint),
      location: 'remote',
      kind: s.kind === 'edit' ? 'edit' : 'generate',
      endpoint: String(s.endpoint),
      token: s.token || null,
      peerId: s.peerId || null,
      peerManaged: !!s.peerManaged,
      models: RemoteImageServerStore._cleanModels(s.models),
      modelLabel: s.modelLabel || null,
      selectedModel: s.selectedModel ? String(s.selectedModel) : null,
    };
  }

  static _cleanModels(models) {
    if (!Array.isArray(models)) return null;
    return models.filter((m) => m && m.id).map((m) => ({ id: String(m.id), label: String(m.label || m.id) }));
  }
}

module.exports = RemoteImageServerStore;
