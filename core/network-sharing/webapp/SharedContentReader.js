const ShareStore = require('../ShareStore');
const SharedConversationView = require('./SharedConversationView');

class SharedContentReader {
  static RAW_TYPES = { image: 'image/png', video: 'video/mp4' };

  constructor(hostService) {
    this._host = hostService;
  }

  resolve(token) {
    const text = String(token || '');
    if (!ShareStore.TOKEN_PATTERN.test(text)) return null;
    return this._host.resolveShare(text) || null;
  }

  artifactHtml(artifactId, token) {
    const chatRouter = this._host.getChatRouter();
    if (!chatRouter || !chatRouter.getArtifactHtml) return null;
    return chatRouter.getArtifactHtml(artifactId, {
      webBase: '',
      dataEndpoint: `/share/${token}/artifact-data`,
      dataReadOnly: true,
    }) || null;
  }

  conversationData(share) {
    if (share.kind !== 'conversation') return null;
    const chatStore = this._host.getChatStore();
    if (!chatStore) return null;
    const conversation = SharedContentReader._attempt(() => chatStore.getConversation(share.targetId), null);
    if (!conversation) return null;
    const messages = SharedContentReader._attempt(() => chatStore.listActiveMessages(conversation.id) || [], []);
    return SharedConversationView.build(conversation, messages, this._conversationArtifacts(conversation.id));
  }

  conversationArtifact(share, artifactId) {
    if (share.kind !== 'conversation') return null;
    const chatRouter = this._host.getChatRouter();
    const artifact = chatRouter && chatRouter.getArtifact ? chatRouter.getArtifact(String(artifactId || '')) : null;
    if (!artifact || artifact.conversationId !== share.targetId) return null;
    return artifact;
  }

  artifactData(share, rootId) {
    const chatRouter = this._host.getChatRouter();
    if (!chatRouter || !chatRouter.getArtifact || !chatRouter.getArtifactData) return null;
    const artifact = chatRouter.getArtifact(String(rootId || ''));
    if (!artifact || !SharedContentReader._shareCovers(chatRouter, share, artifact)) return null;
    const snapshot = chatRouter.getArtifactData(artifact.rootId);
    return snapshot && snapshot.success ? snapshot : null;
  }

  static isUnchangedSince(snapshot, since) {
    const revision = parseInt(since, 10);
    return Number.isFinite(revision) && snapshot.rev <= revision;
  }

  static rawArtifact(artifact) {
    const fallbackType = SharedContentReader.RAW_TYPES[artifact.type];
    if (!fallbackType) return null;
    const bytes = SharedContentReader._attempt(() => Buffer.from(String(artifact.content || ''), 'base64'), null);
    if (!bytes || !bytes.length) return null;
    return { bytes, contentType: artifact.language || fallbackType };
  }

  _conversationArtifacts(conversationId) {
    const chatRouter = this._host.getChatRouter();
    if (!chatRouter || !chatRouter.listConversationArtifacts) return [];
    return SharedContentReader._attempt(() => chatRouter.listConversationArtifacts(conversationId), []);
  }

  static _shareCovers(chatRouter, share, artifact) {
    if (share.kind === 'artifact') {
      const shared = chatRouter.getArtifact(share.targetId);
      return !!shared && shared.rootId === artifact.rootId;
    }
    if (share.kind === 'conversation') return artifact.conversationId === share.targetId;
    return false;
  }

  static _attempt(read, fallback) {
    try {
      return read();
    } catch (_) {
      return fallback;
    }
  }
}

module.exports = SharedContentReader;
