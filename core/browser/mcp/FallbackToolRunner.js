const McpResult = require('../../shell/McpResult');
const SelectorFallback = require('../controller/SelectorFallback');
const NavigationStamp = require('../controller/NavigationStamp');
const McpPayload = require('./McpPayload');

class FallbackToolRunner {
  static NO_SELECTOR_ERROR = 'LLM could not resolve a selector';

  constructor(browserService, llmFallbackService) {
    this._browserService = browserService;
    this._llmFallbackService = llmFallbackService;
  }

  async run(tool) {
    const { fallbackKey = 'selector' } = tool;
    const description = fallbackKey === 'selector' ? tool.args.llmFallback : null;
    const outcome = await SelectorFallback.run(this._spec(tool, description));
    if (outcome.ok) return McpResult.text({ success: true, data: this._data(outcome) });
    const seen = tool.visualFallback && outcome.attempted ? await this._visualClick(tool.tabId, description) : null;
    if (seen) return seen;
    if (!outcome.result) return McpResult.error(FallbackToolRunner.NO_SELECTOR_ERROR);
    return McpResult.error(outcome.result.error || `Failed to ${tool.action}`);
  }

  _spec(tool, description) {
    const service = this._browserService;
    const retryOpts = tool.buildRetryOpts || tool.buildOpts;
    return {
      service: this._llmFallbackService,
      tabId: tool.tabId,
      action: tool.action,
      selector: tool.args.selector,
      description,
      needsSelector: !!tool.fallbackNeedsSelector,
      primary: () => service[tool.method](tool.tabId, tool.buildOpts(tool.args)),
      retry: (resolved) => service[tool.method](tool.tabId, retryOpts({ ...tool.args, selector: resolved })),
    };
  }

  _data(outcome) {
    const data = { ...McpPayload.data(outcome.result) };
    if (outcome.via !== SelectorFallback.VIA_PRIMARY) data.resolvedSelector = outcome.resolvedSelector;
    return NavigationStamp.apply(data, outcome.result);
  }

  async _visualClick(tabId, description) {
    const service = this._browserService;
    if (!description || typeof service.hasVisualGrounding !== 'function' || !service.hasVisualGrounding()) return null;
    const located = await service.locate(tabId, { description, click: true });
    if (!located.success) return null;
    const data = { ...McpPayload.data(located), resolvedBy: (located.data && located.data.resolvedBy) || 'vision' };
    return McpResult.text({ success: true, data: NavigationStamp.apply(data, located) });
  }
}

module.exports = FallbackToolRunner;
