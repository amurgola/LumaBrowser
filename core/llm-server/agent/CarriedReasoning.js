const ContextBudget = require('../../shared/llm/ContextBudget');
const TokenEstimator = require('../../shared/text/TokenEstimator');

class CarriedReasoning {
  static MIN_CHARS = 4000;
  static FRACTION_PER_STEP = 0.25;
  static FRACTION_TOTAL = ContextBudget.SHARES.carriedReasoningTotal;
  static FRACTION_CEILING = 0.6;
  static ELLIPSIS = '…';

  static resolveBudget(ctxPerSlot, req = null, nativeTools = false) {
    const windowChars = CarriedReasoning._usableChars(ctxPerSlot, nativeTools);
    const ceiling = windowChars
      ? Math.floor(windowChars * CarriedReasoning.FRACTION_CEILING)
      : CarriedReasoning.MIN_CHARS * 8;
    const perStep = CarriedReasoning._pick(req && req.charsPerStep, ceiling, CarriedReasoning._defaultPerStep(windowChars));
    const total = CarriedReasoning._pick(req && req.charsTotal, ceiling, CarriedReasoning._defaultTotal(windowChars));
    return { perStep, total: Math.max(total, perStep) };
  }

  static tail(reasoning, perStep) {
    if (!reasoning) return '';
    return reasoning.length > perStep ? `${CarriedReasoning.ELLIPSIS}${reasoning.slice(-perStep)}` : reasoning;
  }

  static _usableChars(ctxPerSlot, nativeTools) {
    const usable = ContextBudget.resolveBudget({ ctxPerSlot, nativeTools }).usableTokens;
    return usable > 0 ? usable * TokenEstimator.CHARS_PER_TOKEN : 0;
  }

  static _defaultPerStep(windowChars) {
    if (!windowChars) return CarriedReasoning.MIN_CHARS;
    return Math.max(CarriedReasoning.MIN_CHARS, Math.floor(windowChars * CarriedReasoning.FRACTION_PER_STEP));
  }

  static _defaultTotal(windowChars) {
    if (!windowChars) return CarriedReasoning.MIN_CHARS * 4;
    return Math.floor(windowChars * CarriedReasoning.FRACTION_TOTAL);
  }

  static _pick(asked, ceiling, fallback) {
    const n = Number(asked);
    return (Number.isFinite(n) && n > 0) ? Math.min(n, ceiling) : fallback;
  }
}

module.exports = CarriedReasoning;
