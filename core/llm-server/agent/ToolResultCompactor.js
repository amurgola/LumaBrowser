const AgentLoopText = require('./AgentLoopText');
const LargeStringShrinker = require('./LargeStringShrinker');
const JsonOutliner = require('../chat/JsonOutliner');
const TokenSizeLabel = require('../chat/outline/TokenSizeLabel');
const ToolOutputTruncator = require('../chat/ToolOutputTruncator');

class ToolResultCompactor {
  static OUTLINE_TOKENS = 500;
  static HARD_CUT_SUFFIX = '... (truncated)';

  constructor(spillWriter = null) {
    this._spill = (spillWriter && typeof spillWriter.write === 'function') ? spillWriter : null;
    this._spillSeq = 0;
  }

  compact(tool, result, maxBytes = ToolOutputTruncator.DEFAULT_MAX_BYTES) {
    if (!result) return 'null';
    if (tool === 'screenshot') return ToolResultCompactor._screenshotText(result);
    if (result.imageBase64) return this.compact(tool, ToolResultCompactor._without(result, 'imageBase64'), maxBytes);
    if (result.noCompact) return JSON.stringify(ToolResultCompactor._without(result, 'noCompact'));
    return this._fitToBudget(tool, result, maxBytes);
  }

  _fitToBudget(tool, result, maxBytes) {
    const serialized = JSON.stringify(result);
    if (serialized.length <= maxBytes) return serialized;
    const spilled = this._spillResult(tool, result, serialized);
    if (spilled) return spilled;
    const shrunk = JSON.stringify(LargeStringShrinker.shrink(result, serialized.length - maxBytes));
    if (shrunk.length <= maxBytes) return shrunk;
    return shrunk.slice(0, maxBytes) + ToolResultCompactor.HARD_CUT_SUFFIX;
  }

  _spillResult(tool, result, serialized) {
    if (!this._spill) return null;
    const seq = ++this._spillSeq;
    let saved = null;
    try { saved = this._spill.write(tool, seq, ToolResultCompactor._pretty(result, serialized), 'json'); } catch (_) { saved = null; }
    if (!saved) return null;
    return [
      AgentLoopText.spillHeader(TokenSizeLabel.ofText(serialized), saved.displayPath),
      JsonOutliner.outline(result, ToolResultCompactor.OUTLINE_TOKENS),
      `[${saved.readable ? AgentLoopText.SPILL_READABLE_HINT : AgentLoopText.SPILL_REQUERY_HINT}]`,
    ].join('\n');
  }

  static _screenshotText(result) {
    if (result.imageBase64) return JSON.stringify(ToolResultCompactor._without(result, 'imageBase64'));
    return JSON.stringify({ success: true, message: AgentLoopText.SCREENSHOT_STRIPPED });
  }

  static _pretty(result, fallback) {
    try { return JSON.stringify(result, null, 2); } catch (_) { return fallback; }
  }

  static _without(result, key) {
    const { [key]: _dropped, ...rest } = result;
    return rest;
  }
}

module.exports = ToolResultCompactor;
