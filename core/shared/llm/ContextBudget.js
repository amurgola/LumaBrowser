const TokenEstimator = require('../text/TokenEstimator');

class ContextBudget {
  static SHARES = Object.freeze({
    carriedReasoningTotal: 0.4,
    toolHistory: 0.35,
    singleToolResult: 0.25,
    compactionKeep: 0.5,
    compactionReserve: 0.15,
  });

  static FIXED = Object.freeze({
    nativeToolSchemasTokens: 4100,
    systemPromptTokens: 1500,
    minGenerationTokens: 4096,
  });

  static DEFAULT_CHECK_WINDOW = 32768;
  static MAX_CONCURRENT_SHARE = 0.8;
  static MIN_SPARE_SHARE = 0.1;
  static MAX_FIXED_SHARE = 0.25;
  static MAX_GENERATION_SHARE = 0.5;

  static resolveBudget({ ctxPerSlot, nativeTools = false, fixedTokens = null } = {}) {
    const window = ContextBudget._windowTokens(ctxPerSlot);
    const fixed = ContextBudget._fixedTokens(fixedTokens, nativeTools);
    const usable = Math.max(0, window - fixed);
    return ContextBudget._allowances(window, fixed, usable);
  }

  static headroomShare() {
    return 1 - ContextBudget._concurrentShare();
  }

  static compactionTrigger() {
    return 1 - ContextBudget.SHARES.compactionReserve;
  }

  static assertCoherent({ ctxPerSlot = ContextBudget.DEFAULT_CHECK_WINDOW, nativeTools = true } = {}) {
    const budget = ContextBudget.resolveBudget({ ctxPerSlot, nativeTools });
    return [
      ContextBudget._concurrentClaimProblem(),
      ContextBudget._singleResultProblem(),
      ContextBudget._compactionProblem(),
      ContextBudget._spareProblem(budget, ctxPerSlot),
      ContextBudget._fixedCostProblem(budget, ctxPerSlot),
    ].filter(Boolean);
  }

  static _windowTokens(ctxPerSlot) {
    const window = Number(ctxPerSlot);
    return window > 0 ? Math.floor(window) : 0;
  }

  static _fixedTokens(fixedTokens, nativeTools) {
    const measured = Number(fixedTokens);
    if (Number.isFinite(measured) && measured > 0) return Math.floor(measured);
    const { systemPromptTokens, nativeToolSchemasTokens } = ContextBudget.FIXED;
    return systemPromptTokens + (nativeTools ? nativeToolSchemasTokens : 0);
  }

  static _allowances(window, fixed, usable) {
    const chars = (share) => Math.floor(usable * share * TokenEstimator.CHARS_PER_TOKEN);
    const { SHARES, FIXED } = ContextBudget;
    return {
      ctxPerSlot: window,
      fixedTokens: fixed,
      usableTokens: usable,
      carriedReasoningChars: chars(SHARES.carriedReasoningTotal),
      toolHistoryChars: chars(SHARES.toolHistory),
      singleToolResultChars: chars(SHARES.singleToolResult),
      compactionTriggerTokens: Math.floor(window * ContextBudget.compactionTrigger()),
      compactionKeepTokens: Math.floor(window * SHARES.compactionKeep),
      headroomTokens: Math.floor(usable * ContextBudget.headroomShare()),
      generationReserveTokens: Math.min(FIXED.minGenerationTokens, Math.floor(usable * ContextBudget.MAX_GENERATION_SHARE)),
    };
  }

  static _concurrentShare() {
    return ContextBudget.SHARES.carriedReasoningTotal + ContextBudget.SHARES.toolHistory;
  }

  static _concurrentClaimProblem() {
    const { carriedReasoningTotal, toolHistory } = ContextBudget.SHARES;
    const concurrent = ContextBudget._concurrentShare();
    if (concurrent >= 1) {
      return `carried reasoning (${carriedReasoningTotal}) and tool history (${toolHistory}) claim `
        + `${concurrent.toFixed(2)} of the window between them, leaving nothing for the task, the assistant turns or the reply`;
    }
    if (concurrent > ContextBudget.MAX_CONCURRENT_SHARE) {
      return `carried reasoning and tool history claim ${concurrent.toFixed(2)} of the window, `
        + `leaving only ${(1 - concurrent).toFixed(2)} for everything else`;
    }
    return null;
  }

  static _singleResultProblem() {
    const { singleToolResult, toolHistory } = ContextBudget.SHARES;
    if (singleToolResult <= toolHistory) return null;
    return `one tool result may be ${singleToolResult} of the window but the whole history is capped at `
      + `${toolHistory}, so a single result cannot fit in its own budget`;
  }

  static _compactionProblem() {
    const keep = ContextBudget.SHARES.compactionKeep;
    const trigger = ContextBudget.compactionTrigger();
    if (keep < trigger) return null;
    return `compaction keeps ${keep} but only runs at ${trigger}, so it would not shrink the context it is triggered by`;
  }

  static _spareProblem(budget, ctxPerSlot) {
    const committed = budget.fixedTokens + Math.floor(budget.usableTokens * ContextBudget._concurrentShare());
    const spare = ctxPerSlot - committed;
    if (spare >= ctxPerSlot * ContextBudget.MIN_SPARE_SHARE) return null;
    return `fixed costs (${budget.fixedTokens}) plus the concurrent history claims commit ${committed} of a `
      + `${ctxPerSlot}-token window, leaving ${spare} for the task and every assistant turn in the run`;
  }

  static _fixedCostProblem(budget, ctxPerSlot) {
    if (budget.usableTokens <= 0) {
      return `a ${ctxPerSlot}-token window is smaller than the ${budget.fixedTokens} tokens every request already costs`;
    }
    if (budget.fixedTokens / ctxPerSlot > ContextBudget.MAX_FIXED_SHARE) {
      return `fixed costs are ${budget.fixedTokens} tokens, over a quarter of a ${ctxPerSlot}-token window`;
    }
    return null;
  }
}

module.exports = ContextBudget;
