const ToolFenceStripper = require('../parsing/ToolFenceStripper');
const TextDrip = require('./TextDrip');

class StreamMirror {
  constructor(hooks) {
    this._hooks = hooks || {};
    this.totalStreamed = '';
    this._iterationStreamed = 0;
    this.toolSuppressed = false;
  }

  beginIteration() {
    this._iterationStreamed = 0;
    this.toolSuppressed = false;
  }

  mirror(token) {
    if (this.toolSuppressed || !this._hooks.onDelta) return;
    try { this._hooks.onDelta(token); } catch (_) {}
    this._iterationStreamed += token.length;
    this.totalStreamed += token;
  }

  suppressForTool() {
    if (this._iterationStreamed > 0 && this._hooks.onContentRollback) {
      this._rollback();
      this._divertToThinking();
    }
    this._iterationStreamed = 0;
    this.toolSuppressed = true;
  }

  retractIteration() {
    if (this._iterationStreamed <= 0) return;
    if (this._hooks.onContentRollback) this._rollback();
    this._divertToThinking();
    this._iterationStreamed = 0;
  }

  async settleFinal(text, isAborted) {
    if (this.totalStreamed === text) return;
    if (this.totalStreamed.length > 0 && this._hooks.onContentRollback) this._hooks.onContentRollback(this.totalStreamed.length);
    this.totalStreamed = '';
    await TextDrip.play(text, this._hooks.onDelta, isAborted);
  }

  _rollback() {
    try { this._hooks.onContentRollback(this._iterationStreamed); } catch (_) {}
  }

  _divertToThinking() {
    const n = this._iterationStreamed;
    const retracted = ToolFenceStripper.stripDebris(this.totalStreamed.slice(-n));
    this.totalStreamed = this.totalStreamed.length >= n ? this.totalStreamed.slice(0, -n) : '';
    if (retracted.trim() && this._hooks.onReasoningDelta) {
      try { this._hooks.onReasoningDelta(`\n${retracted}\n`); } catch (_) {}
    }
  }
}

module.exports = StreamMirror;
