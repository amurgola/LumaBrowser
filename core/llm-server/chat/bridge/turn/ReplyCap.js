const ContextBudget = require('../../../../shared/llm/ContextBudget');
const TokenEstimator = require('../../../../shared/text/TokenEstimator');

class ReplyCap {
  static MAX_BOOST = 4;
  static FLOOR_TOKENS = 512;
  static MARGIN_TOKENS = 256;

  constructor(ctxPerSlot) {
    this._ctxPerSlot = Number(ctxPerSlot);
    this._boost = 1;
  }

  maxTokens(messages) {
    const ctx = this._ctxPerSlot;
    if (!Number.isFinite(ctx) || ctx <= 0) return undefined;
    const used = TokenEstimator.estimateTokens(JSON.stringify(messages || []));
    const cap = ContextBudget.FIXED.minGenerationTokens * this._boost;
    return Math.max(ReplyCap.FLOOR_TOKENS, Math.min(ctx - used - ReplyCap.MARGIN_TOKENS, cap));
  }

  noteLengthCut() {
    this._boost = Math.min(ReplyCap.MAX_BOOST, this._boost * 2);
  }
}

module.exports = ReplyCap;
