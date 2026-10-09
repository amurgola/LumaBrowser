const ToolConcurrency = require('../../llm-service/ToolConcurrency');

class RunOptions {
  static DEFAULTS = Object.freeze({
    priorTurns: null,
    tabId: undefined,
    autoCloseTab: true,
    includeScreenshot: false,
    maxIterations: 15,
    maxParallelToolCalls: ToolConcurrency.DEFAULT_MAX_PARALLEL_TOOL_CALLS,
    timeout: 300000,
    onToolResultEvicted: null,
    nativeTools: false,
    nativeToolsTokens: 0,
    tools: undefined,
    systemPromptAppend: undefined,
    systemPromptOverride: undefined,
    label: null,
    promptExperiments: null,
    onEvent: undefined,
    onWorkTab: undefined,
    shouldAbort: undefined,
    lazyTab: false,
    noBrowser: false,
    ctxPerSlot: null,
    resultSpill: null,
    conversationId: null,
    carriedReasoning: null,
    screenshotVision: false,
  });

  static normalize(options = {}) {
    const merged = { ...RunOptions.DEFAULTS };
    for (const [key, value] of Object.entries(options || {})) {
      if (value !== undefined) merged[key] = value;
    }
    return RunOptions._withDerived(merged);
  }

  static _withDerived(options) {
    return {
      ...options,
      maxParallel: ToolConcurrency.resolveMaxParallel(options.maxParallelToolCalls),
      lazy: (options.lazyTab || options.noBrowser) && options.tabId == null,
    };
  }
}

module.exports = RunOptions;
