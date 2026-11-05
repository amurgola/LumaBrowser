const DsmlToolCallParser = require('../parsing/DsmlToolCallParser');
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
    return this._buf.indexOf(IterationStream.FENCE) !== -1 || XmlToolCallParser.OPEN.test(this._buf)
      || DsmlToolCallParser.EARLY.test(this._buf);
  }

  _suppress() {
    this._mirror.suppressForTool();
    const start = IterationStream._callStart(this._buf);
    this._pending.begin(start);
    this._pending.update(this._buf, true);
  }

  static _callStart(buf) {
    const at = [buf.indexOf(IterationStream.FENCE), buf.search(XmlToolCallParser.OPEN), buf.search(DsmlToolCallParser.EARLY)]
      .filter((i) => i !== -1);
    return at.length ? Math.min(...at) : 0;
  }
}

module.exports = IterationStream;
