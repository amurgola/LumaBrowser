# LlmSelectorFallback

`extensions/selenium-driver/LlmSelectorFallback.js`

Connects the WebDriver server to core's
[LlmFallbackService](../../core/browser/LlmFallbackService.md) and
[LlmFallbackOrchestrator](../../core/browser/LlmFallbackOrchestrator.md).

## Methods

- `LlmSelectorFallback.createService(context)`: null without `context.llm` or a tab
  manager; else a new LlmFallbackService over `context.llm` and that tab manager.
- `LlmSelectorFallback.resolveDescription(service, tabId, description, action = 'find', failedSelector = null)`
  -> CSS selector or null; never throws into the W3C envelope.
