const ToolConcurrency = require('../../../llm-service/ToolConcurrency');

class AgentBudget {
  static DEFAULT = Object.freeze({
    maxIterations: 24,
    timeoutMs: 8 * 60 * 1000,
    maxParallelToolCalls: ToolConcurrency.DEFAULT_MAX_PARALLEL_TOOL_CALLS,
  });

  static MAX_ITERATIONS = 100;
  static MAX_TIMEOUT_MS = 45 * 60 * 1000;

  static MIN_MALFORMED_REPROMPTS = 3;
  static MAX_MALFORMED_REPROMPTS = 12;

  static resolve(req, { nativeTools = false } = {}) {
    return {
      maxIterations: AgentBudget._iterations(req),
      timeout: AgentBudget._timeout(req),
      maxParallelToolCalls: ToolConcurrency.resolveMaxParallel(
        req && req.maxParallelToolCalls,
        nativeTools ? ToolConcurrency.NATIVE_MAX_PARALLEL_TOOL_CALLS : AgentBudget.DEFAULT.maxParallelToolCalls,
      ),
      carriedReasoning: AgentBudget._carriedReasoning(req),
    };
  }

  static maxMalformedReprompts(budget) {
    return Math.min(AgentBudget.MAX_MALFORMED_REPROMPTS,
      Math.max(AgentBudget.MIN_MALFORMED_REPROMPTS, Math.ceil(budget.maxIterations / 4)));
  }

  static _iterations(req) {
    return Math.min(AgentBudget.MAX_ITERATIONS,
      Math.max(AgentBudget.DEFAULT.maxIterations, AgentBudget._positive(req && req.maxIterations)));
  }

  static _timeout(req) {
    if (req && req.noTimeout) return Infinity;
    return Math.min(AgentBudget.MAX_TIMEOUT_MS,
      Math.max(AgentBudget.DEFAULT.timeoutMs, AgentBudget._positive(req && req.timeoutMs)));
  }

  static _carriedReasoning(req) {
    const perStep = AgentBudget._positive(req && req.reasoningCharsPerStep);
    const total = AgentBudget._positive(req && req.reasoningCharsTotal);
    if (!perStep && !total) return null;
    return { charsPerStep: perStep || undefined, charsTotal: total || undefined };
  }

  static _positive(value) {
    return (typeof value === 'number' && Number.isFinite(value) && value > 0) ? value : 0;
  }
}

module.exports = AgentBudget;
