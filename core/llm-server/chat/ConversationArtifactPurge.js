class ConversationArtifactPurge {
  constructor({ conversationId, artifactStore, artifactDataStore, artifactTaskStore, pinnedRootIds } = {}) {
    this._conversationId = conversationId;
    this._artifactStore = artifactStore;
    this._artifactDataStore = artifactDataStore || null;
    this._artifactTaskStore = artifactTaskStore || null;
    this._pinned = new Set((pinnedRootIds || []).map(String));
    this._outcome = { purged: [], kept: [] };
  }

  execute() {
    if (!this._conversationId || !this._artifactStore) return this._outcome;
    for (const rootId of this._listChainRootIds()) {
      if (this._pinned.has(rootId)) this._keepChain(rootId);
      else this._purgeChain(rootId);
    }
    return this._outcome;
  }

  _listChainRootIds() {
    try {
      return (this._artifactStore.list(this._conversationId) || []).map((chain) => String(chain.rootId || chain.id));
    } catch (_) {
      return [];
    }
  }

  _keepChain(rootId) {
    try {
      this._artifactStore.reparent(rootId, { conversationId: null, messageId: null });
      this._outcome.kept.push(rootId);
    } catch (_) {}
  }

  _purgeChain(rootId) {
    ConversationArtifactPurge._attempt(() => this._artifactDataStore && this._artifactDataStore.deleteForRoot(rootId));
    ConversationArtifactPurge._attempt(() => this._artifactTaskStore && this._artifactTaskStore.deleteByRoot(rootId));
    ConversationArtifactPurge._attempt(() => {
      if (this._artifactStore.deleteRoot(rootId) > 0) this._outcome.purged.push(rootId);
    });
  }

  static _attempt(step) {
    try { step(); } catch (_) {}
  }
}

module.exports = ConversationArtifactPurge;
