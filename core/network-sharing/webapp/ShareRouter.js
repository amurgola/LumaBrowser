const express = require('express');
const path = require('path');
const SharedContentReader = require('./SharedContentReader');

class ShareRouter {
  static PUBLIC_DIR = path.join(__dirname, 'public');
  static VIEWER_FILE = 'share-view.html';

  constructor(hostService, { publicDir = ShareRouter.PUBLIC_DIR } = {}) {
    this._reader = new SharedContentReader(hostService);
    this._publicDir = publicDir;
  }

  build() {
    const router = express.Router();
    router.use('/:token', (req, res, next) => this._resolveShare(req, res, next));
    router.get('/:token', (req, res) => this._sendShare(req, res));
    router.get('/:token/data', (req, res) => this._sendConversationData(req, res));
    router.get('/:token/artifact/:id', (req, res) => this._sendConversationArtifact(req, res));
    router.get('/:token/artifact-data/:rootId', (req, res) => this._sendArtifactData(req, res));
    router.get('/:token/artifact/:id/raw', (req, res) => this._sendRawArtifact(req, res));
    router.use((req, res) => ShareRouter._notFound(res));
    return router;
  }

  _resolveShare(req, res, next) {
    const share = this._reader.resolve(req.params.token);
    if (!share) return ShareRouter._notFound(res);
    req.share = share;
    return next();
  }

  _sendShare(req, res) {
    if (req.share.kind === 'artifact') return this._sendArtifactDocument(res, req.share.targetId, req.params.token);
    return res.sendFile(ShareRouter.VIEWER_FILE, { root: this._publicDir });
  }

  _sendConversationData(req, res) {
    const data = this._reader.conversationData(req.share);
    if (!data) return ShareRouter._notFound(res);
    return res.json(data);
  }

  _sendConversationArtifact(req, res) {
    const artifact = this._reader.conversationArtifact(req.share, req.params.id);
    if (!artifact) return ShareRouter._notFound(res);
    return this._sendArtifactDocument(res, artifact.id, req.params.token);
  }

  _sendArtifactData(req, res) {
    const snapshot = this._reader.artifactData(req.share, req.params.rootId);
    if (!snapshot) return ShareRouter._notFound(res);
    if (SharedContentReader.isUnchangedSince(snapshot, req.query.since)) return res.status(204).end();
    return res.json(snapshot);
  }

  _sendRawArtifact(req, res) {
    const artifact = this._reader.conversationArtifact(req.share, req.params.id);
    const raw = artifact && SharedContentReader.rawArtifact(artifact);
    if (!raw) return ShareRouter._notFound(res);
    res.setHeader('Content-Type', raw.contentType);
    return res.send(raw.bytes);
  }

  _sendArtifactDocument(res, artifactId, token) {
    const html = this._reader.artifactHtml(artifactId, token);
    if (!html) return ShareRouter._notFound(res);
    return res.type('html').send(html);
  }

  static _notFound(res) {
    return res.status(404).send('Not found');
  }
}

module.exports = ShareRouter;
