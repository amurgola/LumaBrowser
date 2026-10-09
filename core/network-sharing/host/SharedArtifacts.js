class SharedArtifacts {
  static DATA_ENDPOINT = '/sharing/artifact-data';

  constructor(service) {
    this._service = service;
  }

  describe(id) {
    const chatRouter = this._service.getChatRouter();
    const artifact = chatRouter && typeof chatRouter.getArtifact === 'function' ? chatRouter.getArtifact(id) : null;
    if (!artifact) return { status: 404, body: { error: 'artifact not found' } };
    const isImage = artifact.type === 'image';
    return {
      status: 200,
      body: {
        id: artifact.id,
        title: artifact.title,
        type: artifact.type,
        mime: isImage ? (artifact.language || 'image/png') : null,
        language: isImage ? null : artifact.language,
        content: artifact.content,
      },
    };
  }

  html(id) {
    const chatRouter = this._service.getChatRouter();
    if (!chatRouter || typeof chatRouter.getArtifactHtml !== 'function') return null;
    return chatRouter.getArtifactHtml(id, { webBase: '', dataEndpoint: SharedArtifacts.DATA_ENDPOINT });
  }

  data(rootId, since) {
    const chatRouter = this._service.getChatRouter();
    if (!chatRouter || typeof chatRouter.getArtifactData !== 'function') return SharedArtifacts._unavailable();
    const snapshot = chatRouter.getArtifactData(rootId);
    if (!snapshot.success) return { status: 404, body: snapshot };
    const sinceRev = parseInt(since, 10);
    if (Number.isFinite(sinceRev) && snapshot.rev <= sinceRev) return { status: 204, body: null };
    return { status: 200, body: snapshot };
  }

  mutate(rootId, body = {}) {
    const chatRouter = this._service.getChatRouter();
    if (!chatRouter || typeof chatRouter.mutateArtifactData !== 'function') return SharedArtifacts._unavailable();
    const result = chatRouter.mutateArtifactData(rootId, { set: body.set, remove: body.remove });
    return { status: result.success ? 200 : 400, body: result };
  }

  static _unavailable() {
    return { status: 503, body: { success: false, error: 'artifact data unavailable' } };
  }
}

module.exports = SharedArtifacts;
