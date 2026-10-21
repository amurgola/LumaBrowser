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

  async settleFinal(text, isAborted, pace = {}) {
    const shown = this.totalStreamed;
    const canonical = String(text == null ? '' : text);
    if (shown === canonical) return;
    const common = StreamMirror._commonPrefix(shown, canonical);
    const extra = shown.length - common;
    if (extra > 0 && this._hooks.onContentRollback) this._rollbackChars(extra);
    this.totalStreamed = canonical;
    await TextDrip.play(canonical.slice(common), this._hooks.onDelta, isAborted, pace);
  }

  static _commonPrefix(a, b) {
    const max = Math.min(a.length, b.length);
    let i = 0;
    while (i < max && a.charCodeAt(i) === b.charCodeAt(i)) i++;
    return i;
  }

  _rollbackChars(n) {
    try { this._hooks.onContentRollback(n); } catch (_) {}
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
