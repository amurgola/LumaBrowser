const ExtensionGlobals = require('../../core/shell/extensions/ExtensionGlobals');

class ArtifactBubbler {
  constructor(chat, getRouter = () => ExtensionGlobals.chatRouter()) {
    this._chat = chat && typeof chat === 'object' ? chat : null;
    this._getRouter = getRouter;
    this._bubbled = [];
  }

  bubble(artifact) {
    if (!this._chat || !artifact || !artifact.id) return;
    this._reparent(artifact);
    this._bubbled.push({
      id: artifact.id,
      rootId: artifact.rootId || artifact.id,
      version: typeof artifact.version === 'number' ? artifact.version : 1,
      title: artifact.title || 'Artifact',
      type: artifact.type || 'artifact',
    });
    if (typeof this._chat.onArtifact === 'function') {
      try { this._chat.onArtifact(artifact); } catch (_) {}
    }
  }

  summaries() {
    const byRoot = new Map();
    for (const b of this._bubbled) {
      const prev = byRoot.get(b.rootId);
      if (!prev || b.version >= prev.version) byRoot.set(b.rootId, b);
    }
    return [...byRoot.values()].map(({ id, title, type }) => ({ id, title, type }));
  }

  _reparent(artifact) {
    try {
      const router = this._getRouter();
      const deps = (router && typeof router.getAgentDeps === 'function' && router.getAgentDeps()) || {};
      if (deps.artifactStore && typeof deps.artifactStore.reparent === 'function' && this._chat.conversationId) {
        deps.artifactStore.reparent(artifact.id, {
          conversationId: this._chat.conversationId,
          messageId: this._chat.assistantMessageId || null,
        });
      }
    } catch (_) {}
  }
}

module.exports = ArtifactBubbler;
