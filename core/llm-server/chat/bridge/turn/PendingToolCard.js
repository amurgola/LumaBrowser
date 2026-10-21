const ToolCallSniffer = require('../parsing/ToolCallSniffer');

class PendingToolCard {
  static EMIT_MS = 250;

  constructor(hooks, { now = () => Date.now(), index = null } = {}) {
    this._hooks = hooks || {};
    this._now = now;
    this._index = Number.isInteger(index) ? index : null;
    this._tool = null;
    this._target = null;
    this._startIdx = -1;
    this._lastEmit = 0;
  }

  begin(startIdx) {
    this._startIdx = startIdx;
  }

  update(buf, force) {
    if (!this._hooks.onToolEvent) return;
    const tool = this._tool || ToolCallSniffer.toolName(buf);
    const target = this._target || ToolCallSniffer.target(buf);
    const grew = (tool && tool !== this._tool) || (target && target !== this._target);
    const now = this._now();
    if (!force && !grew && now - this._lastEmit < PendingToolCard.EMIT_MS) return;
    this._tool = tool || this._tool;
    this._target = target || this._target;
    this._lastEmit = now;
    const chars = this._startIdx >= 0 ? buf.length - this._startIdx : 0;
    const event = { phase: 'pending', tool: this._tool, target: this._target, chars };
    if (this._index !== null) event.index = this._index;
    try {
      this._hooks.onToolEvent(event);
    } catch (_) {}
  }
}

module.exports = PendingToolCard;
