# ReaderResolver

`extensions/site-apis/runtime/ReaderResolver.js`

Resolution for the reader steps (`read`, `extract`, `table`). The core `SelectorFallback` works from the
interactable-element snapshot (`AccessibleAttributeMatcher`, `InteractableElements`), so a heading, a row or a
table can never be found there and the model is shown a list without the target; this class replaces that path
for readers.

## Methods

- `new ReaderResolver({ browser, service, logger })`: `service` is the `LlmFallbackService` (null disables the
  LLM pass).
- `run({ tabId, step, action, selector, description, allowLlm, primary(selector) })` -> the `SelectorFallback`
  outcome shape `{ ok, via, result, resolvedSelector, attempted, strategy }`:
  1. the stored selector through `primary` (`via: 'primary'`);
  2. the deterministic [ReaderScripts](ReaderScripts.md) probe; its match is run through `primary`
     (`strategy: 'reader:text' | 'reader:rows' | 'reader:table'`);
  3. when `allowLlm` and the service is available: up to two `service.resolveSelector(tabId, description, action,
     failedSelector, { snapshot: candidates, feedbackContext })` turns over the probe's candidates. A `read`
     answer must match exactly one element (`SelectorValidation` through `executeJs`); `extract` and `table`
     answers are judged by the action itself (rows came back). A rejected answer is fed back to the next turn.
- A recovered `read` whose values are all empty text counts as the wrong element and is rejected (the live
  defect: `#q` read "").

## Decisions

Validation differs from the core orchestrator on purpose: a row selector matches many elements, so uniqueness
is replaced by "the action produced rows".
