# LlmFallbackService

`core/browser/LlmFallbackService.js`

Resolves natural-language element descriptions to CSS selectors. The retry
flow around it (deterministic, cache, LLM attempts) is
[LlmFallbackOrchestrator](LlmFallbackOrchestrator.md).

## Methods

- `new LlmFallbackService(llmService, tabManager)` registers
  the optional core LLM slot `selector-resolver` (label "Selector Resolver
  (fast, low-latency model recommended)") when `llmService.registerSlot` exists.
- Properties: `llmService`, `tabManager`, and
  `resolutionCache` (null until the app wiring sets it).
- `isAvailable()`: false only when the active provider is `none`.
- `tryDeterministicResolve(tabId, description)`: `tabManager.findByAccessibleAttributes`,
  no LLM. A missing or non-string description gives `{ success: false }`; a throw
  becomes `{ success: false, error }`.
- `validateSelector(tabId, selector)`: runs [SelectorValidation](llm-fallback/SelectorValidation.md)
  in the tab; `{ ok, count, error? }`, ok only for exactly one match or exactly
  one visible match. Never throws.
- `snapshotFor(tabId)`: up to 80 interactable elements (`getInteractableElements`), `[]` on failure.
- `resolveSelector(tabId, description, action, failedSelector, { snapshot, feedbackContext })`:
  one LLM turn. Refuses with `No LLM provider configured` when unavailable.
  Uses the given snapshot or fetches it, builds the
  [SelectorPrompt](llm-fallback/SelectorPrompt.md), calls
  `sendCompletion('selector-resolver', messages, { temperature: 0 })`, reads the
  text with ResponseText and parses it with
  [SelectorReplyParser](llm-fallback/SelectorReplyParser.md). Returns
  `{ success: true, selector }` or `{ success: false, error }`.
- `LlmFallbackService.debug` (from `LLM_FALLBACK_DEBUG=1|true`, flippable at
  runtime) logs every turn with a `[LlmFallback]` prefix, and summarises an
  empty reply with [EmptyReplyDiagnostic](llm-fallback/EmptyReplyDiagnostic.md)
  (full dump once per process).

## Why

Resolution goes cheap to expensive: the accessibility match costs no tokens.
No `max_tokens` is sent so the slot's own ceiling rules; `temperature: 0`
because the same prompt must give the same selector.
