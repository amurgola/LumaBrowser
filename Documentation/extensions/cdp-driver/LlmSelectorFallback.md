# LlmSelectorFallback

`extensions/cdp-driver/LlmSelectorFallback.js`

Connects the extension to core's selector fallback:
[LlmFallbackService](../../core/browser/LlmFallbackService.md) and
[LlmFallbackOrchestrator](../../core/browser/LlmFallbackOrchestrator.md)
(accessibility match, resolution cache, validated LLM attempts).

## Methods

- `LlmSelectorFallback.createService(context)` -> a new LlmFallbackService with
  `context.llm` and `context.browser.getTabManager()`. Null without `context.llm`
  or a tab manager.
- `LlmSelectorFallback.resolveDescription(service, tabId, description, action = 'find', failedSelector = null)`
  -> the resolved CSS selector or null. Never throws, so a fallback failure cannot
  break a CDP reply. The retry action is a passthrough: only the orchestrator's
  validation is wanted.
