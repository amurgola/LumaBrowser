class AttachmentArtifacts {
  constructor({ chatStore, getAgentDeps }) {
    this._store = chatStore;
    this._getAgentDeps = getAgentDeps;
  }

  persist(images, convId, userRow) {
    if (!images.length || !userRow) return [];
    const artifactStore = this._artifactStore();
    if (!artifactStore) return [];
    const artifacts = images.map((img) => AttachmentArtifacts._create(artifactStore, img, convId, userRow.id)).filter(Boolean);
    if (artifacts.length) this._recordOn(userRow.id, artifacts);
    return artifacts;
  }

  _artifactStore() {
    const deps = this._getAgentDeps ? this._getAgentDeps() : null;
    return (deps && deps.artifactStore) || null;
  }

  static _create(artifactStore, img, conversationId, messageId) {
    try {
      const art = artifactStore.create({
        conversationId,
        messageId,
        title: img.name || 'Image',
        type: 'image',
        mime: img.mime || 'image/png',
        content: img.base64,
      });
      return { id: art.id, title: art.title, type: 'image', language: art.language };
    } catch (err) {
      console.error('[llm-chat] failed to persist image attachment as artifact:', err && err.message);
      return null;
    }
  }

  _recordOn(messageId, artifacts) {
    try { this._store.updateMessage(messageId, { toolCalls: { artifacts } }); } catch (_) {}
  }
}

module.exports = AttachmentArtifacts;
