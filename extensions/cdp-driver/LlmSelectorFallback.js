const LlmFallbackService = require('../../core/browser/LlmFallbackService');
const LlmFallbackOrchestrator = require('../../core/browser/LlmFallbackOrchestrator');

class LlmSelectorFallback {
  static createService(context) {
    if (!context.llm) return null;
    const tabManager = context.browser && context.browser.getTabManager ? context.browser.getTabManager() : null;
    if (!tabManager) return null;
    return new LlmFallbackService(context.llm, tabManager);
  }

  static async resolveDescription(fallbackService, tabId, description, action, failedSelector) {
    if (!fallbackService) return null;
    try {
      const fallback = await LlmFallbackOrchestrator.resolve(
        fallbackService, tabId, description, action || 'find', failedSelector || null, LlmSelectorFallback._passthrough,
      );
      return fallback ? fallback.resolvedSelector : null;
    } catch (_) {
      return null;
    }
  }

  static async _passthrough(resolvedSelector) {
    return { success: true, data: { selector: resolvedSelector } };
  }
}

module.exports = LlmSelectorFallback;
