const GameFlattener = require('../flatten/GameFlattener');
const GameJson = require('../session/GameJson');

class GamePublisher {
  constructor({ getRouter = () => global.__lumaChatRouter, getSharing = () => global.__lumaSharingHostService } = {}) {
    this._getRouter = getRouter;
    this._getSharing = getSharing;
  }

  publish(root, rawConvId) {
    const store = this._artifactStore();
    if (!store) return GamePublisher._fail(503, 'artifact store unavailable');
    const title = GameJson.nameOf(root) || 'Game';
    let flat;
    try { flat = GameFlattener.flatten(root); } catch (e) { return GamePublisher._fail(500, `flatten failed: ${e.message}`); }
    let artifact;
    try {
      artifact = store.create({ conversationId: rawConvId, title, type: 'html', content: flat.html });
    } catch (e) { return GamePublisher._fail(500, `artifact create failed: ${e.message}`); }
    return { status: 200, body: GamePublisher._body(artifact, flat, this._shareLink(artifact, title)) };
  }

  _artifactStore() {
    let deps = null;
    try {
      const router = this._getRouter();
      deps = router && typeof router.getAgentDeps === 'function' ? router.getAgentDeps() : null;
    } catch (_) { deps = null; }
    const store = deps && deps.artifactStore;
    return store && typeof store.create === 'function' ? store : null;
  }

  _shareLink(artifact, title) {
    try {
      const svc = this._getSharing();
      const status = svc && typeof svc.getShareLinkStatus === 'function' ? svc.getShareLinkStatus() : null;
      if (!status) return GamePublisher._noShare('sharing service unavailable');
      if (!status.available) return GamePublisher._noShare(status.reason || 'share links unavailable');
      const r = svc.createShareLink({ kind: 'artifact', targetId: artifact.id, title });
      return r && r.success ? { available: true, url: r.url, reason: null } : GamePublisher._noShare((r && r.error) || 'share link refused');
    } catch (e) { return GamePublisher._noShare(e.message); }
  }

  static _noShare(reason) {
    return { available: false, url: null, reason };
  }

  static _body(artifact, flat, share) {
    return {
      success: true,
      artifactId: artifact.id,
      artifactUrl: artifact.url || null,
      bytes: flat.bytes,
      inlinedScripts: flat.inlinedScripts,
      inlinedAssets: flat.inlinedAssets,
      share,
    };
  }

  static _fail(status, error) {
    return { status, body: { success: false, error } };
  }
}

module.exports = GamePublisher;
