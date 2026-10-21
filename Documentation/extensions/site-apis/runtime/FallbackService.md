# FallbackService

`extensions/site-apis/runtime/FallbackService.js`

Builds the core `LlmFallbackService` the selector recovery runs through.

## Methods

- `FallbackService.build({ llm, chat, browser })` -> `LlmFallbackService` or null (no tab manager, or neither
  `llm` nor `chat`). With `llm` (`context.llm`, the app's `LLMService`) the service's own `selector-resolver`
  slot applies; without it `FallbackService.adapter(chat)` stands in. The app's resolution cache
  (`global.__lumaResolutionCache`, published by `AutomationServices`) is attached when present so cached
  resolutions replay.
- `FallbackService.adapter(chat)`: the three `llmService` members `LlmFallbackService` calls
  (`getActiveProviderKey`, `registerSlot`, `sendCompletion(slot, messages, { temperature })`) answered by
  `chat.complete({ messages, temperature, noThink: true, timeoutMs })`, mapped to `{ success, response }`.

## Why a private instance

The app builds its `LlmFallbackService` in `app/browser/AutomationServices.js` and hands it to
`BrowserController` and `BrowserMcpTools` by constructor; it is not published on `AppGlobals` or any surface an
extension receives. The cdp-driver and selenium-driver extensions do the same thing this class does
(`new LlmFallbackService(context.llm, context.browser.getTabManager())`); this one adds the chat adapter so
recovery works with the runner's contract (`{ store, browser, chat, ... }`) even when `context.llm` is not passed.
