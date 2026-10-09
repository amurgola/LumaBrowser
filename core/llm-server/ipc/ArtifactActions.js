class ArtifactActions {
  static UNAVAILABLE = 'Artifacts aren’t available yet.';
  static NOT_FOUND = 'Artifact not found.';

  constructor(deps) {
    this._deps = deps;
  }

  listForConversation(conversationId) {
    const store = this._deps.artifactStore();
    return { artifacts: store ? store.list(conversationId) : [] };
  }

  listAll(opts) {
    const store = this._deps.artifactStore();
    return { artifacts: store ? store.listAllRoots(opts || {}) : [] };
  }

  versions(idOrRootId) {
    const store = this._deps.artifactStore();
    return { versions: store ? store.versions(idOrRootId) : [] };
  }

  get(id) {
    const store = this._deps.artifactStore();
    if (!store) return { success: false, error: ArtifactActions.UNAVAILABLE };
    const art = store.get(id);
    if (!art) return { success: false, error: ArtifactActions.NOT_FOUND };
    return {
      success: true,
      artifact: { id: art.id, title: art.title, type: art.type, language: art.language, content: art.content, rootId: art.rootId, version: art.version },
    };
  }

  async open(id) {
    const agentDeps = this._deps.agentDeps();
    const store = agentDeps && agentDeps.artifactStore;
    if (!store || !agentDeps.browserService) return { success: false, error: ArtifactActions.UNAVAILABLE };
    if (!store.get(id)) return { success: false, error: ArtifactActions.NOT_FOUND };
    store.ensureFile(id);
    const url = store.urlFor(id);
    await agentDeps.browserService.createTab(url);
    return { success: true, url };
  }

  delete(id) {
    const store = this._deps.artifactStore();
    if (!store) return { success: false, error: ArtifactActions.UNAVAILABLE };
    const rootId = store.rootIdFor(id) || id;
    const removed = store.delete(id);
    if (removed && store.versions(rootId).length === 0) this._purgeChainStores(rootId);
    return { success: true, removed };
  }

  deleteRoot(idOrRootId) {
    const store = this._deps.artifactStore();
    if (!store) return { success: false, error: ArtifactActions.UNAVAILABLE };
    this._purgeChainStores(store.rootIdFor(idOrRootId) || idOrRootId);
    return { success: true, removed: store.deleteRoot(idOrRootId) };
  }

  _purgeChainStores(rootId) {
    const dataStore = this._deps.get('artifactDataStore');
    const taskStore = this._deps.get('artifactTaskStore');
    if (dataStore) {
      try { dataStore.deleteForRoot(rootId); } catch (_) {}
    }
    if (taskStore) {
      try { taskStore.deleteByRoot(rootId); } catch (_) {}
    }
  }
}

module.exports = ArtifactActions;
