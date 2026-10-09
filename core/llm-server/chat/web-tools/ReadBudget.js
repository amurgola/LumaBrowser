const TokenEstimator = require('../../../shared/text/TokenEstimator');
const ToolOutputTruncator = require('../ToolOutputTruncator');

class ReadBudget {
  static TEXT_SHARE = 0.8;
  static MIN_PART_TOKENS = 1000;
  static MAX_PART_TOKENS = 12000;

  static partChars(ctxPerSlotTokens) {
    const allowanceBytes = ToolOutputTruncator.forSlotBudget(ctxPerSlotTokens).maxBytes;
    const fitted = Math.floor(allowanceBytes * ReadBudget.TEXT_SHARE);
    const floor = TokenEstimator.tokensToChars(ReadBudget.MIN_PART_TOKENS);
    const ceiling = TokenEstimator.tokensToChars(ReadBudget.MAX_PART_TOKENS);
    return Math.min(Math.max(fitted, floor), ceiling);
  }
}

module.exports = ReadBudget;
