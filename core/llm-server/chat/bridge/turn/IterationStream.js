const XmlToolCallParser = require('../parsing/XmlToolCallParser');
const ArtifactStreamPreview = require('./ArtifactStreamPreview');
const PendingToolCard = require('./PendingToolCard');

class IterationStream {
  static FENCE = '```tool';

  constructor({ hooks, mirror, allows }) {
    this._mirror = mirror;
    this._pending = new PendingToolCard(hooks);
    this._preview = new ArtifactStreamPreview(hooks, allows);
    this._buf = '';
    this.onToken = (token) => this._receive(token);
  }

  _receive(token) {
    if (!token) return;
    this._buf += token;
    if (!this._mirror.toolSuppressed && this._opensToolCall()) this._suppress();
    if (this._mirror.toolSuppressed) this._pending.update(this._buf, false);
    this._mirror.mirror(token);
    this._preview.onBuffer(this._buf);
  }

  _opensToolCall() {
    return this._buf.indexOf(IterationStream.FENCE) !== -1 || XmlToolCallParser.OPEN.test(this._buf);
  }

  _suppress() {
    this._mirror.suppressForTool();
    const fenceAt = this._buf.indexOf(IterationStream.FENCE);
    const xmlAt = this._buf.search(XmlToolCallParser.OPEN);
    const start = Math.min(fenceAt === -1 ? Infinity : fenceAt, xmlAt === -1 ? Infinity : xmlAt);
    this._pending.begin(Number.isFinite(start) ? start : 0);
    this._pending.update(this._buf, true);
  }
}

module.exports = IterationStream;
