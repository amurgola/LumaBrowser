const ContextBudget = require('../../shared/llm/ContextBudget');
const TokenEstimator = require('../../shared/text/TokenEstimator');

class ToolHistoryBudget {
  static FRACTION = ContextBudget.SHARES.toolHistory;
  static DEFAULT_CHARS = 48000;
  static MIN_CHARS = 4000;

  static forSlot(ctxPerSlot, nativeTools = false) {
    const window = ToolHistoryBudget._window(ctxPerSlot);
    if (!window) return ToolHistoryBudget.DEFAULT_CHARS;
    const usable = ContextBudget.resolveBudget({ ctxPerSlot: window, nativeTools }).usableTokens;
    return Math.max(ToolHistoryBudget.MIN_CHARS, Math.floor(usable * TokenEstimator.CHARS_PER_TOKEN * ToolHistoryBudget.FRACTION));
  }

  static soft(ctxPerSlot, fixedTokens) {
    const window = ToolHistoryBudget._window(ctxPerSlot);
    if (!window) return ToolHistoryBudget.DEFAULT_CHARS;
    const budget = ContextBudget.resolveBudget({ ctxPerSlot: window, fixedTokens });
    const share = Math.floor(budget.usableTokens * TokenEstimator.CHARS_PER_TOKEN * ToolHistoryBudget.FRACTION);
    const leaveClear = Math.floor((budget.usableTokens - budget.generationReserveTokens) * TokenEstimator.CHARS_PER_TOKEN);
    return Math.max(ToolHistoryBudget.MIN_CHARS, Math.min(share, leaveClear));
  }

  static hard(ctxPerSlot, fixedTokens) {
    const window = ToolHistoryBudget._window(ctxPerSlot);
    if (!window) return Infinity;
    const budget = ContextBudget.resolveBudget({ ctxPerSlot: window, fixedTokens });
    const room = (budget.usableTokens - budget.generationReserveTokens) * (1 - ContextBudget.SHARES.carriedReasoningTotal);
    return Math.max(ToolHistoryBudget.MIN_CHARS, Math.floor(room * TokenEstimator.CHARS_PER_TOKEN));
  }

  static _window(ctxPerSlot) {
    const n = Number(ctxPerSlot);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }
}

module.exports = ToolHistoryBudget;
