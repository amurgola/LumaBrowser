const TokenEstimator = require('../shared/text/TokenEstimator');

class ChunkBudget {
  static BUDGET_TOKENS = 384;
  static CARRY_TOKENS = 48;
  static SECTION_FLOOR_RATIO = 0.25;

  constructor(options = {}) {
    this.maxChars = TokenEstimator.tokensToChars(options.maxTokens || ChunkBudget.BUDGET_TOKENS);
    this.carryChars = ChunkBudget._carryChars(options.overlapTokens);
    this.sectionFloorChars = Math.floor(this.maxChars * ChunkBudget.SECTION_FLOOR_RATIO);
    this.headingContext = options.headingContext !== false;
  }

  fits(length) {
    return length <= this.maxChars;
  }

  static _carryChars(overlapTokens) {
    const tokens = overlapTokens != null ? Number(overlapTokens) : ChunkBudget.CARRY_TOKENS;
    return tokens > 0 ? TokenEstimator.tokensToChars(tokens) : 0;
  }
}

module.exports = ChunkBudget;
