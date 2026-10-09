class ArtifactAccess {
  static DATA_UNAVAILABLE = { success: false, error: 'artifact data unavailable' };

  constructor({ getAgentDeps }) {
    this._getAgentDeps = getAgentDeps;
  }

  get(id) {
    const store = this._dep('artifactStore');
    return store ? store.get(id) : null;
  }

  html(id, opts) {
    const store = this._dep('artifactStore');
    if (!store || typeof store.renderedHtml !== 'function') return null;
    return store.renderedHtml(id, opts);
  }

  data(idOrRootId) {
    const store = this._dep('artifactDataStore');
    return store ? store.all(idOrRootId) : { ...ArtifactAccess.DATA_UNAVAILABLE };
  }

  mutate(idOrRootId, ops) {
    const store = this._dep('artifactDataStore');
    return store ? store.mutate(idOrRootId, ops || {}) : { ...ArtifactAccess.DATA_UNAVAILABLE };
  }

  listFor(conversationId) {
    const store = this._dep('artifactStore');
    return store ? store.list(conversationId) : [];
  }

  _dep(name) {
    const deps = this._getAgentDeps ? this._getAgentDeps() : null;
    return (deps && deps[name]) || null;
  }
}

module.exports = ArtifactAccess;
