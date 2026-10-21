const LlmFallbackService = require('../../../core/browser/LlmFallbackService');

class FallbackService {
  static CACHE_GLOBAL = '__lumaResolutionCache';
  static ADAPTER_PROVIDER = 'chat';
  static COMPLETION_TIMEOUT_MS = 45000;

  static build({ llm = null, chat = null, browser = null } = {}) {
    const tabManager = browser && typeof browser.getTabManager === 'function' ? browser.getTabManager() : null;
    if (!tabManager) return null;
    const llmService = llm || (chat && typeof chat.complete === 'function' ? FallbackService.adapter(chat) : null);
    if (!llmService) return null;
    const service = new LlmFallbackService(llmService, tabManager);
    service.resolutionCache = global[FallbackService.CACHE_GLOBAL] || null;
    return service;
  }

  static adapter(chat) {
    return {
      getActiveProviderKey: () => FallbackService.ADAPTER_PROVIDER,
      registerSlot: () => {},
      sendCompletion: async (slotId, messages, options = {}) => {
        const reply = await chat.complete({
          messages,
          temperature: options.temperature === undefined ? 0 : options.temperature,
          noThink: true,
          timeoutMs: FallbackService.COMPLETION_TIMEOUT_MS,
          trace: 'site-apis:selector-resolver',
        });
        if (!reply || reply.error || typeof reply.text !== 'string') return { success: false, error: (reply && reply.error) || 'no reply' };
        return { success: true, response: reply.text };
      },
    };
  }
}

module.exports = FallbackService;
