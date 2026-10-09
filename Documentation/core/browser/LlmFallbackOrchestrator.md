# LlmFallbackOrchestrator

`core/browser/LlmFallbackOrchestrator.js`

Resolves a natural-language element description to a working selector when the caller's selector failed.

## Methods

- `LlmFallbackOrchestrator.resolve(llmFallbackService, tabId, description, action, failedSelector, retryFn)`
  creates a fresh orchestrator and runs it. `retryFn(selector)` performs the caller's action and
  returns `{ success, error?, data? }`. Resolves to
  `{ result, resolvedSelector, strategy, resolvedBy? }` or `null`. Returns `null` immediately when
  `description` or the service is missing.
- `new LlmFallbackOrchestrator(...same args).execute()` is the same thing in two steps. An instance
  holds per-call state, so never reuse one across calls.

`strategy` is `deterministic:<strategy>`, `cache`, or `llm:attempt-<n>`. Cache hits also carry
`resolvedBy: 'cache'`, stamped onto `result.data` when that is a plain object, else onto `result`.

## Flow

1. **Deterministic**: `service.tryDeterministicResolve` (accessibility-attribute match, no LLM). If it
   yields a selector and the action succeeds, done. If the action fails, the wrong element was picked,
   so fall through rather than fail.
2. **Resolution cache**: `service.resolutionCache.replay(...)` (only when the cache exists, is enabled
   and the service has a `tabManager`). Runs before the provider check so a cached answer replays even
   with no model configured. A failing cached selector is reported via `noteMiss(key, { hard: true })`
   and the flow continues.
3. **LLM**, skipped when `service.isAvailable()` is false. The page snapshot is fetched once and
   reused. Up to 2 attempts, each feeding the previous failure back as `feedbackContext`:
   - no selector returned: the LLM's error is fed back;
   - a selector already tried: rejected without running the action again;
   - live DOM validation (`service.validateSelector`) must match exactly one element;
   - the element is captured for the cache before acting, because a click may navigate;
   - on success the capture is stored with `cache.remember(description, action, captured, 'llm')`.

Logging goes to `console.log` with a `[LlmFallback]` prefix only when the service's class has a
truthy static `debug`.

## Service contract

The orchestrator calls `tryDeterministicResolve`, `isAvailable`, `resolveSelector`, `snapshotFor`,
`validateSelector`, and the properties `resolutionCache` and `tabManager` of
[LlmFallbackService](LlmFallbackService.md). The legacy service kept `snapshotFor` and
`validateSelector` underscore-prefixed; the port made them public.
