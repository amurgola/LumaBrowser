const ArtifactStreamSniffer = require('../parsing/ArtifactStreamSniffer');

class ArtifactStreamPreview {
  static MAX_BUFFER_CHARS = 200000;
  static EMIT_MS = 140;

  constructor(hooks, allows, { now = () => Date.now() } = {}) {
    this._hooks = hooks || {};
    this._allows = allows;
    this._now = now;
    this._opened = false;
    this._lastEmit = 0;
  }

  onBuffer(buf) {
    if (!this._hooks.onArtifactStream || buf.length > ArtifactStreamPreview.MAX_BUFFER_CHARS) return;
    if (!this._allows('create_artifact') || !/create_artifact/.test(buf)) return;
    const type = ArtifactStreamSniffer.field(buf, 'type') || 'html';
    const title = ArtifactStreamSniffer.field(buf, 'title') || 'Artifact';
    if (!this._opened) {
      this._opened = true;
      this._hooks.onArtifactStream({ phase: 'open', title, type });
    }
    const content = ArtifactStreamSniffer.stringValue(buf, 'content');
    if (content == null) return;
    const now = this._now();
    if (now - this._lastEmit < ArtifactStreamPreview.EMIT_MS) return;
    this._lastEmit = now;
    this._hooks.onArtifactStream({ phase: 'chunk', title, type, content });
  }
}

module.exports = ArtifactStreamPreview;
